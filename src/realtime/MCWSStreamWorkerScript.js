(function (self, WebSocket) {
  "use strict";

  let worker;

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
   */
  class MCWSConnection {
    /**
     * @param {string} url the WebSocket URL
     * @param {string} property the property to filter on
     * @param {Object} topic metadata about the topic to listen on
     * @param {Object} extraFilterTerms additional filter terms
     * @param {Object} globalFilters global filters to apply
     */
    constructor(url, property, topic, extraFilterTerms, globalFilters) {
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
    subscribe(key) {
      this.subscribers[key] = (this.subscribers[key] || 0) + 1;
      if (this.subscribers[key] === 1) {
        this.scheduleReconnect();
      }
    }

    /**
     * Notify the connection that a subscription to the specified channel
     * has ended.
     * MCWSConnection keeps a count of active subscriptions in order to
     * adjust filtering parameters as necessary.
     * @param {string} key the channel or module to unsubscribe to
     * @private
     */
    unsubscribe(key) {
      this.subscribers[key] = (this.subscribers[key] || 0) - 1;
      if (this.subscribers[key] < 1) {
        delete this.subscribers[key];
        this.scheduleReconnect();
      }
    }

    /**
     * Construct a query string for this connection's current topic, session
     * and subscription state.
     * @returns {string} the query string
     * @private
     */
    query() {
      const filter = {
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
            console.warn(`Global filter not applied for existing persisted filter for ${key}.`);
          } else {
            filter[key] = value;
          }
        });
      }

      return 'filter=(' + Object.keys(filter).filter(function (key) {
        return !!filter[key];
      }).map(function (key) {
        return key + '=' + filter[key];
      }).join(',') + ')';
    }

    /**
     * Close any active WebSocket associated with this connection.
     * @private
     */
    destroy() {
      if (this.socket) {
        this.socket.close();
        delete this.socket;
      }
    }

    /**
     * Set the topic for the active session.
     * @param {Object} topic metadata for the selected topic, as provided
     *        by MCWS
     * @private
     */
    setTopic(topic) {
      this.topic = topic;
      this.scheduleReconnect();
    }

    setGlobalFilters(filters) {
      this.globalFilters = filters;
      this.scheduleReconnect();
    }

    scheduleReconnect() {
      if (this.pending) {
        clearTimeout(this.pending);
      }
      this.pending = setTimeout(() => {
        this.pending = undefined;
        this.reconnect();
      }, 10);
    }

    /**
     * Reestablish the connection to the WebSocket (typically called because
     * filtering parameters have changed.)
     * @private
     */
    reconnect() {
      const oldSocket = this.socket;
      const url = this.url;
      const subscribers = this.subscribers;
      const property = this.property;

      if (Object.keys(subscribers).length < 1 || !this.topic) {
        if (oldSocket) {
          oldSocket.close();
          delete this.socket;
        }
        return;
      }

      this.socket = new WebSocket(this.url + "?" + this.query());

      this.socket.onopen = function () {
        if (oldSocket) {
          oldSocket.close();
        }
      };

      this.socket.onmessage = function (message) {
        const data = JSON.parse(message.data);

        data.forEach(function (datum) {
          const key = datum[property];
          if (subscribers[key] > 0) {
            self.postMessage({
              url: url,
              key: key,
              values: [datum]
            });
          }
        });
      };

      this.socket.onclose = function (message) {
        self.postMessage({
          onclose: true,
          code: message.code,
          reason: message.reason
        });
      };

      this.socket.onerror = function (error) {
        self.postMessage({
          onerror: true,
          code: error.code,
          reason: error.reason
        });
      };
    }
  }

  /**
   * Manages connections for streaming channel data on a background.
   * Creates, updates, and releases connections as necessary when
   * the set of subscriptions changes.
   *
   * Methods may be invoked by posting a message to the worker
   * with an object containing `key` and `value` properties, where
   * `key` is the method name and `value` is the argument to provide.
   */
  class MCWSStreamWorker {
    constructor() {
      this.connections = {};
    }

    /**
     * Release all active WebSocket connections.
     */
    reset() {
      Object.keys(this.connections).forEach((url) => {
        this.connections[url].destroy();
        delete this.connections[url];
      });
      delete this.activeTopic;
      delete this.activeGlobalFilters;
    }

    /**
     * Add a new active subscription.
     * @param {MCWSStreamSubscription} subscription the subscription to obtain
     */
    subscribe(subscription) {
      const url = subscription.url;
      const key = subscription.key;
      const property = subscription.property;
      const extraFilterTerms = subscription.extraFilterTerms;
      const cacheKey = this.generateCacheKey(url, property, extraFilterTerms);

      if (!this.connections[cacheKey]) {
        this.connections[cacheKey] = new MCWSConnection(
          url,
          property,
          this.activeTopic,
          extraFilterTerms,
          this.activeGlobalFilters
        );
      }

      this.connections[cacheKey].subscribe(key);
    }

    generateCacheKey(url, property, extraFilterTerms) {
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
    unsubscribe(subscription) {
      const url = subscription.url;
      const key = subscription.key;
      const property = subscription.property;
      const extraFilterTerms = subscription.extraFilterTerms;
      const cacheKey = this.generateCacheKey(url, property, extraFilterTerms);

      if (this.connections[cacheKey]) {
        this.connections[cacheKey].unsubscribe(key);
      }
    }

    /**
     * Change the current topic selection.
     * @param {Object} topic metadata about the selected topic
     */
    topic(topic) {
      this.activeTopic = topic;
      Object.keys(this.connections).forEach((cacheKey) => {
        this.connections[cacheKey].setTopic(topic);
      });
    }

    /**
     * Change the global filters.
     * @param {Object} filters metadata about the filters
     */
    globalFilters(filters) {
      this.activeGlobalFilters = filters;
      Object.keys(this.connections).forEach((cacheKey) => {
        this.connections[cacheKey].setGlobalFilters(filters);
      });
    }
  }

  worker = new MCWSStreamWorker();
  self.onmessage = function (messageEvent) {
    const data = messageEvent.data;
    const method = worker[data.key];
    if (method) {
      method.call(worker, data.value);
    }
  };

}(self, WebSocket));