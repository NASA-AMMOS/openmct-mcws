/*global setTimeout,clearTimeout,self,WebSocket*/
(function (self, WebSocket) {
    "use strict";

    var worker;

    // Add debug logging helper
    function debugLog(message, data) {
        self.postMessage({
            debug: true,
            message: message,
            data: data
        });
    }

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
    }

    /**
     * Notify the connection of a new subscription to the specified channel.
     * MCWSConnection keeps a count of active subscriptions in order to
     * adjust filtering parameters as necessary.
     * @param {string} key the channel or module to subscribe to
     * @private
     */
    MCWSConnection.prototype.subscribe = function (key) {
        debugLog('MCWSConnection.subscribe', { url: this.url, key: key });
        this.subscribers[key] = (this.subscribers[key] || 0) + 1;
        if (this.subscribers[key] === 1) {
            debugLog('First subscription for key, scheduling reconnect', { key: key });
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
        debugLog('MCWSConnection.unsubscribe', { url: this.url, key: key });
        this.subscribers[key] = (this.subscribers[key] || 0) - 1;
        if (this.subscribers[key] < 1) {
            delete this.subscribers[key];
            debugLog('No more subscriptions for key, scheduling reconnect', { key: key });
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
        if (this.socket) {
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
        var oldSocket = this.socket,
            url = this.url,
            subscribers = this.subscribers,
            property = this.property;

        debugLog('MCWSConnection.reconnect', { 
            url: url, 
            subscriberCount: Object.keys(subscribers).length,
            hasTopic: !!this.topic
        });

        if (Object.keys(subscribers).length < 1 || !this.topic) {
            if (oldSocket) {
                debugLog('Closing socket - no subscribers or no topic', { url: url });
                oldSocket.close();
                delete this.socket;
            }
            return;
        }

        var fullUrl = this.url + "?" + this.query();
        debugLog('Creating new WebSocket', { fullUrl: fullUrl });
        this.socket = new WebSocket(fullUrl);

        this.socket.onopen = function () {
            debugLog('WebSocket opened', { url: url });
            if (oldSocket) {
                debugLog('Closing old socket', { url: url });
                oldSocket.close();
            }
        };

        this.socket.onmessage = function (message) {
            var data = JSON.parse(message.data);
            debugLog('WebSocket message received', { 
                url: url, 
                dataLength: data.length 
            });

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
                reason: message.reason 
            });
            self.postMessage({
                onclose: true,
                code: message.code,
                reason: message.reason
            });
        };

        this.socket.onerror = function (error) {
            debugLog('WebSocket error', { 
                url: url, 
                code: error.code, 
                reason: error.reason 
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
        
        debugLog('Worker received message', { 
            key: data.key, 
            hasMethod: !!method,
            valueType: typeof data.value
        });
        
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
