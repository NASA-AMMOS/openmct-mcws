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
     * Notify the connection of a new subscription to the specified endpoint.
     * MCWSConnection keeps a count of active subscriptions in order to
     * adjust filtering parameters as necessary.
     * @param {string} key the endpoint to subscribe to
     * @private
     */
    subscribe(key) {
      this.subscribers[key] = (this.subscribers[key] ?? 0) + 1;

      if (this.subscribers[key] === 1) {
        this.scheduleReconnect();
      }
    }

    /**
     * Notify the connection that a subscription to the specified endpoint
     * has ended.
     * MCWSConnection keeps a count of active subscriptions in order to
     * adjust filtering parameters as necessary.
     * @param {string} key the endpoint to unsubscribe to
     * @private
     */
    unsubscribe(key) {
      this.subscribers[key] = (this.subscribers[key] ?? 0) - 1;

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
    getQueryString() {
      const filter = {
        session_id: this.topic?.number,
        topic: this.topic?.topic
      };

      if (this.property !== 'some_undefined_property') {
        filter[this.property] = `(${Object.keys(this.subscribers).join(',')})`;
      }

      if (this.extraFilterTerms) {
        Object.keys(this.extraFilterTerms).forEach((term) => {
          filter[term] = this.extraFilterTerms[term];
        });
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

      return `filter=(${Object.keys(filter)
        .filter((key) => Boolean(filter[key]))
        .map((key) => `${key}=${filter[key]}`)
        .join(',')})`;
    }

    /**
     * Close any active WebSocket associated with this connection.
     * Handles pending messages and different socket states.
     * @private
     */
    // async destroy() {
    //   console.log('destroy');
    //   await this.closeSocket(this.socket);
    //   delete this.socket;
    // }

    /**
     * Close the WebSocket if it exists.
     * @param {WebSocket} socket the WebSocket to close
     * @private
     */
    // async closeSocket(socket) {
    //   if (socket) {
    //     // Define custom close code and reason
    //     const closeCode = 1000; // Normal closure
    //     const closeReason = 'Connection closed by client due to subscription changes or no subscribers';
        
    //     // Check socket readiness state before closing
    //     if (socket.readyState === WebSocket.CONNECTING) {
    //       // For connecting sockets, we need to wait for the connection to establish or fail
    //       return new Promise(resolve => {
    //         socket.addEventListener('open', () => {
    //           console.log('open');
    //           socket.close(closeCode, closeReason);
    //           resolve();
    //         });
            
    //         socket.addEventListener('error', () => {
    //           console.log('error');
    //           socket.close(closeCode, closeReason);
    //           resolve();
    //         });
            
    //         // Add a timeout in case the socket gets stuck in connecting state
    //         setTimeout(() => {
    //           if (socket.readyState === WebSocket.CONNECTING) {
    //             console.log('timeout');
    //             socket.close(closeCode, closeReason);
    //             resolve();
    //           }
    //         }, 1000);
    //       });
    //     } else if (socket.readyState === WebSocket.OPEN) {
    //       // For open sockets, return a promise that resolves when the socket is closed
    //       return new Promise(resolve => {
    //         socket.addEventListener('close', () => {
    //           console.log('close');
    //           resolve();
    //         });
    //         socket.close(closeCode, closeReason);
    //       });
    //     } else {
    //       // Socket is already closing or closed
    //       return;
    //     }
    //   }
    // }

    /**
     * Set the topic for the active session.
     * @param {Object} topic metadata for the selected topic, as provided
     * by MCWS
     * @private
     */
    setTopic(topic) {
      this.topic = topic;
      this.scheduleReconnect();
    }

    /**
     * Set the global filters for the active session.
     * @param {Object} filters metadata for the selected filters, as provided
     * by MCWS
     * @private
     */
    setGlobalFilters(filters) {
      this.globalFilters = filters;
      this.scheduleReconnect();
    }

    /**
     * Schedule a reconnection to the WebSocket.
     * @private
     */
    scheduleReconnect() {
      if (this.pending) {
        clearTimeout(this.pending);
      }

      this.reconnectStartTime = Date.now();
      this.pending = setTimeout(() => {
        this.pending = undefined;
        this.reconnect();
      }, 100); // Keep the 250ms timeout for better batching
    }

    /**
     * Reestablish the connection to the WebSocket (typically called because
     * filtering parameters have changed.)
     * @private
     */
    reconnect() {
      let oldSocket = this.socket;
      const { url, subscribers, property } = this;
            
      // no subscribers or no topic close existing socket
      // suppress errors as they are not useful
      if (oldSocket && (Object.keys(subscribers).length < 1 || !this.topic)) {
        try {
          oldSocket.onclose = null;
          oldSocket.onerror = null;
          oldSocket.close();
        } catch (e) {
            // Suppress errors
        }

        oldSocket = undefined;
        this.socket = undefined;
        return;
      }

      // Create a new WebSocket connection with the updated query parameters
      this.socket = new WebSocket(`${this.url}?${this.getQueryString()}`);

      // close old socket in new socket open to ensure
      // no data is lost
      this.socket.onopen = async () => {
        const connectionTime = Date.now() - this.reconnectStartTime;
        console.log('reconnect open - connection time:', connectionTime, 'ms');
        if (oldSocket) {
          try {
            oldSocket.onclose = null;
            oldSocket.onerror = null;
            oldSocket.close();
          } catch (e) {
            // Suppress errors
          }
          oldSocket = undefined;
        }
      };

      this.socket.onmessage = (message) => {
        const data = JSON.parse(message.data);

        data.forEach((datum) => {
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

      this.socket.onclose = (message) => {
        console.log('reconnect onclose');
        self.postMessage({
          onclose: true,
          code: message.code,
          reason: message.reason
        });
      };

      this.socket.onerror = (error) => {
        console.log('reconnect onerror', error);
        self.postMessage({
          onerror: true,
          url: this.url,
          query: this.getQueryString(),
          code: error.code || 'unavailable',
          reason: error.reason || 'WebSocket error occurred, but browser did not provide detailed error information'
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
    // async reset() {
    //   console.log('streamWorker reset');
    //   const urls = Object.keys(this.connections);
    //   await Promise.all(urls.map(async (url) => {
    //     await this.connections[url].destroy();
    //     delete this.connections[url];
    //   }));
    //   delete this.activeTopic;
    //   delete this.activeGlobalFilters;
    // }

    /**
     * Add a new active subscription.
     * @param {MCWSStreamSubscription} subscription the subscription to obtain
     */
    subscribe(subscription) {
      const { url, key, property, extraFilterTerms } = subscription;
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
        .map(filterKey => `${filterKey}=${extraFilterTerms[filterKey]}`)
        .join('&');
      let cacheKey = `${url}__${property}`;

      if (filterComponent?.length > 0) {
        cacheKey += `__${filterComponent}`;
      }

      return cacheKey;
    }

    /**
     * Add a new active subscription.
     * @param {MCWSStreamSubscription} subscription the subscription to release
     */
    unsubscribe(subscription) {
      const { url, key, property, extraFilterTerms } = subscription;
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