/*global setTimeout,clearTimeout,self,WebSocket*/
(function (self, WebSocket) {
    "use strict";

    var worker;

    // Add debug logging helper - only log connection pool related events
    function debugLog(message, data) {
        // Only log messages related to connection pooling
        if (message.includes('pool') || 
            message.includes('WebSocket') || 
            message.includes('connection') ||
            message.includes('reconnect')) {
            self.postMessage({
                debug: true,
                message: message,
                data: data
            });
        }
    }

    // Connection pool configuration
    const CONNECTION_POOL_TIMEOUT = 10000; // 10 seconds before closing unused connections

    /**
     * Represents a subscription to streaming channel data for
     * a specific EVR or Channel.
     * @typedef MCWSStreamSubscription
     * @property {string} url the WebSocket URL to request data from
     * @property {string} key the identifier for the specific Channel or EVR
     * @property {string} property the name of the property to use when
     *           filtering, and when looking up keys from data points
     */

    /**
     * Manages a connection to a specific WebSocket URL for
     * streaming channel data. Post messages from the worker thread
     * as data arrives. Recreates the underlying WebSocket
     * as necessary when query parameters change.
     * @param {string} url the WebSocket URL
     * @param {string} property the property to filter on
     * @param {Object} topic metadata about the topic to listen on
     * @constructor
     * @private
     */
    function MCWSConnection(url, property, topic, extraFilterTerms, globalFilters) {
        this.url = url;
        this.topic = topic;
        this.subscribers = {};
        this.property = property;
        this.extraFilterTerms = extraFilterTerms;
        this.globalFilters = globalFilters;
        this.poolTimeout = null;
    }

    /**
     * Notify the connection of a new subscription to the specified channel.
     * MCWSConnection keeps a count of active subscriptions in order to
     * adjust filtering parameters as necessary.
     * @param {string} key the channel or module to subscribe to
     * @private
     */
    MCWSConnection.prototype.subscribe = function (key) {
        // Only log first subscription and pool-related events
        if (!this.subscribers[key]) {
            debugLog('MCWSConnection.subscribe - first subscription', { url: this.url, key: key });
        }
        
        // Clear any pending pool timeout
        if (this.poolTimeout) {
            debugLog('Clearing pool timeout - connection reused', { 
                url: this.url, 
                key: key,
                timestamp: Date.now()
            });
            clearTimeout(this.poolTimeout);
            this.poolTimeout = null;
        }
        
        this.subscribers[key] = (this.subscribers[key] || 0) + 1;
        if (this.subscribers[key] === 1) {
            this.scheduleReconnect();
        }
    };

    /**
     * Notify the connection that a subscription to the specified channel
     * has ended.
     * MCWSConnection keeps a count of active subscriptions in order to
     * adjust filtering parameters as necessary.
     * @param {string} key the channel or module to unsubscribe to
     * @private
     */
    MCWSConnection.prototype.unsubscribe = function (key) {
        this.subscribers[key] = (this.subscribers[key] || 0) - 1;
        if (this.subscribers[key] < 1) {
            delete this.subscribers[key];
            this.scheduleReconnect();
        }
    };

    /**
     * Construct a query string for this connection's current topic, session
     * and subscription state.
     * @returns {string} the query string
     * @private
     */
    MCWSConnection.prototype.query = function () {
        var filter = {
            session_id: this.topic && this.topic.number,
            topic: this.topic && this.topic.topic
        };

        if (this.property !== 'some_undefined_property') {
            filter[this.property] =
                '(' + Object.keys(this.subscribers).join(',') + ')';
        }

        if (this.extraFilterTerms) {
            Object.keys(this.extraFilterTerms).forEach(function (k) {
                filter[k] = this.extraFilterTerms[k];
            }, this);
        }

        if (this.globalFilters) {
          Object.entries(this.globalFilters).forEach(([key, value]) => {
            if (filter[key]) {
              debugLog('Global filter not applied for existing persisted filter', { key: key });
              console.warn(`Global filter not applied for existing persisted filter for ${key}.`);
            } else {
              filter[key] = value;
            }
          });
        }

        var queryString = 'filter=(' + Object.keys(filter).filter(function (key) {
            return !!filter[key];
        }).map(function (key) {
            return key + '=' + filter[key];
        }).join(',') + ')';
        
        debugLog('Generated query string', { 
            url: this.url, 
            queryString: queryString,
            subscribers: Object.keys(this.subscribers)
        });
        
        return queryString;
    };

    /**
     * Close any active WebSocket associated with this connection.
     * @private
     */
    MCWSConnection.prototype.destroy = function () {
        if (this.poolTimeout) {
            debugLog('Destroying pooled connection - clearing timeout', { 
                url: this.url,
                timestamp: Date.now()
            });
            clearTimeout(this.poolTimeout);
            this.poolTimeout = null;
        }
        
        if (this.socket) {
            debugLog('Destroying connection', { 
                url: this.url,
                timestamp: Date.now(),
                socketId: this.socket.id
            });
            this.socket.close();
            delete this.socket;
        }
    };

    /**
     * Set the topic for the active session.
     * @param {Object} topic metadata for the selected topic, as provided
     *        by MCWS
     * @private
     */
    MCWSConnection.prototype.setTopic = function (topic) {
        this.topic = topic;
        this.scheduleReconnect();
    };

    MCWSConnection.prototype.setGlobalFilters = function (filters) {
        this.globalFilters = filters;
        this.scheduleReconnect();
    };

    MCWSConnection.prototype.scheduleReconnect = function () {
        if (this.pending) {
            clearTimeout(this.pending);
        }
        this.pending = setTimeout(function () {
            this.pending = undefined;
            this.reconnect();
        }.bind(this), 10);
    };

    /**
     * Reestablish the connection to the WebSocket (typically called because
     * filtering parameters have changed.)
     * @private
     */
    MCWSConnection.prototype.reconnect = function () {
        var url = this.url,
            property = this.property,
            subscribers = this.subscribers,
            topic = this.topic,
            extraFilterTerms = this.extraFilterTerms,
            globalFilters = this.globalFilters,
            self = this,
            oldSocket = this.socket;

        // If we have a pooled connection and it's still open, just reuse it
        if (this.poolTimeout && oldSocket && oldSocket.readyState === WebSocket.OPEN) {
            debugLog('Reusing pooled WebSocket connection', {
                url: url,
                timestamp: Date.now(),
                socketId: oldSocket.id
            });
            clearTimeout(this.poolTimeout);
            this.poolTimeout = null;
            return;
        }

        debugLog('MCWSConnection.reconnect', { 
            url: url, 
            subscriberCount: Object.keys(subscribers).length,
            hasTopic: !!this.topic,
            timestamp: Date.now(),
            oldSocketId: oldSocket ? oldSocket.id : null
        });

        // If no subscribers, don't immediately close - add to connection pool
        if (Object.keys(subscribers).length < 1) {
            if (!this.poolTimeout) {
                debugLog('No subscribers, adding connection to pool', { 
                    url: url,
                    timestamp: Date.now(),
                    socketId: this.socket ? this.socket.id : null
                });
                this.poolTimeout = setTimeout(function() {
                    debugLog('Connection pool timeout reached, closing socket', { 
                        url: url,
                        timestamp: Date.now(),
                        socketId: this.socket ? this.socket.id : null
                    });
                    if (this.socket) {
                        this.socket.close();
                        delete this.socket;
                    }
                    this.poolTimeout = null;
                }.bind(this), CONNECTION_POOL_TIMEOUT);
            }
            return;
        }

        // No topic, close connection
        if (!this.topic) {
            if (oldSocket) {
                debugLog('Closing socket - no topic', { 
                    url: url,
                    timestamp: Date.now(),
                    socketId: oldSocket.id
                });
                oldSocket.close();
                delete this.socket;
            }
            return;
        }

        var fullUrl = this.url + "?" + this.query();
        var socketId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        debugLog('Creating new WebSocket', { 
            fullUrl: fullUrl, 
            socketId: socketId,
            timestamp: Date.now()
        });
        
        this.socket = new WebSocket(fullUrl);
        this.socket.id = socketId;  // Add ID to socket object

        this.socket.onopen = function () {
            debugLog('WebSocket opened', { 
                url: url,
                timestamp: Date.now(),
                socketId: socketId
            });
            if (oldSocket && oldSocket !== this.socket) {
                debugLog('Closing old socket', { 
                    url: url,
                    timestamp: Date.now(),
                    oldSocketId: oldSocket.id,
                    newSocketId: this.socket.id
                });
                oldSocket.close();
            }
        }.bind(this);

        this.socket.onmessage = function (message) {
            var data = JSON.parse(message.data);

            data.forEach(function (datum) {
                var key = datum[property];
                if (subscribers[key] > 0) {
                    self.postMessage({
                        url: url,
                        key: key,
                        values: [ datum ]
                    });
                }
            });
        };

        this.socket.onclose = function (message) {
            debugLog('WebSocket closed', { 
                url: url, 
                code: message.code, 
                reason: message.reason,
                timestamp: Date.now(),
                socketId: socketId,
                isPooled: !!this.poolTimeout
            });
            
            // Only notify if this isn't a pooled connection being closed
            if (!this.poolTimeout) {
                self.postMessage({
                    onclose: true,
                    url: url,
                    code: message.code,
                    reason: message.reason
                });
            }
        }.bind(this);

        this.socket.onerror = function (error) {
            debugLog('WebSocket error', { 
                url: url, 
                code: error.code, 
                reason: error.reason,
                timestamp: Date.now(),
                socketId: socketId
            });
            self.postMessage({
                onerror: true,
                code: error.code,
                reason: error.reason
            });
        };
    };


    /**
     * Manages connections for streaming channel data on a background.
     * Creates, updates, and releases connections as necessary when
     * the set of subscriptions changes.
     *
     * Methods may be invoked by posting a message to the worker
     * with an object containing `key` and `value` properties, where
     * `key` is the method name and `value` is the argument to provide.
     * @constructor
     */
    function MCWSStreamWorker() {
        this.connections = {};
    }

    /**
     * Release all active WebSocket connections.
     */
    MCWSStreamWorker.prototype.reset = function () {
        Object.keys(this.connections).forEach(function (url) {
            this.connections[url].destroy();
            delete this.connections[url];
        }.bind(this));
        delete this.activeTopic;
        delete this.activeGlobalFilters;
    };

    /**
     * Add a new active subscription.
     * @param {MCWSStreamSubscription} subscription the subscription to obtain
     */
    MCWSStreamWorker.prototype.subscribe = function (subscription) {
        const url = subscription.url;
        const key = subscription.key;
        const property = subscription.property;
        const extraFilterTerms = subscription.extraFilterTerms;
        const cacheKey = this.generateCacheKey(url, property, extraFilterTerms);

        debugLog('MCWSStreamWorker.subscribe', { 
            url: url, 
            key: key, 
            property: property,
            cacheKey: cacheKey,
            hasExtraFilters: !!extraFilterTerms
        });

        if (!this.connections[cacheKey]) {
            debugLog('Creating new connection', { cacheKey: cacheKey });
            this.connections[cacheKey] = new MCWSConnection(
                url,
                property,
                this.activeTopic,
                extraFilterTerms,
                this.activeGlobalFilters
            );
        }

        this.connections[cacheKey].subscribe(key);
    };

    MCWSStreamWorker.prototype.generateCacheKey = function (url, property, extraFilterTerms) {
        let filterComponent = extraFilterTerms && Object.keys(extraFilterTerms)
            .sort()
            .map(filterKey => filterKey + '=' + extraFilterTerms[filterKey])
            .join('&');
        let cacheKey = url + '__' + property;
        if (filterComponent && filterComponent.length > 0) {
            cacheKey += '__' + filterComponent
        }
        return cacheKey;
    }

    /**
     * Add a new active subscription.
     * @param {MCWSStreamSubscription} subscription the subscription to release
     */
    MCWSStreamWorker.prototype.unsubscribe = function (subscription) {
        var url = subscription.url,
            key = subscription.key,
            property = subscription.property,
            extraFilterTerms = subscription.extraFilterTerms,
            cacheKey = this.generateCacheKey(url, property, extraFilterTerms);

        debugLog('MCWSStreamWorker.unsubscribe', { 
            url: url, 
            key: key, 
            property: property,
            cacheKey: cacheKey
        });

        if (this.connections[cacheKey]) {
            this.connections[cacheKey].unsubscribe(key);
        } else {
            debugLog('Warning: Tried to unsubscribe from non-existent connection', { 
                cacheKey: cacheKey 
            });
        }
    };

    /**
     * Change the current topic selection.
     * @param {Object} topic metadata about the selected topic
     */
    MCWSStreamWorker.prototype.topic = function (topic) {
        this.activeTopic = topic;
        Object.keys(this.connections).forEach(function (cacheKey) {
            this.connections[cacheKey].setTopic(topic);
        }.bind(this));
    };

    /**
     * Change the global filters.
     * @param {Object} filters metadata about the filters
     */
    MCWSStreamWorker.prototype.globalFilters = function (filters) {
      this.activeGlobalFilters = filters;
      Object.keys(this.connections).forEach(function (cacheKey) {
          this.connections[cacheKey].setGlobalFilters(filters);
      }.bind(this));
  };

    worker = new MCWSStreamWorker();
    self.onmessage = function (messageEvent) {
        var data = messageEvent.data,
            method = worker[data.key];
        
        // Only log specific worker messages to reduce noise
        if (data.key === 'subscribe' || data.key === 'unsubscribe') {
            debugLog('Worker received ' + data.key + ' message', { 
                url: data.value.url,
                key: data.value.key,
                timestamp: Date.now()
            });
        }
        
        if (method) {
            method.call(worker, data.value);
        } else {
            debugLog('Warning: Unknown method called on worker', { key: data.key });
        }
    };

    // Add handler in main thread to display debug logs
    if (typeof window !== 'undefined') {
        window.addEventListener('message', function(event) {
            if (event.data && event.data.debug) {
                console.log('[MCWSStreamWorker]', event.data.message, event.data.data);
            }
        });
    }

}(self, WebSocket));
