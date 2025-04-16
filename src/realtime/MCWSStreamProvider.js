import runMCWSStreamWorker from './MCWSStreamWorker';
import sessionService from 'services/session/SessionService';
import filterService from 'services/filtering/FilterService';
import GlobalStaleness from 'services/globalStaleness/globalStaleness';

/**
 * Provides real-time streaming telemetry for channels/EVRs with an
 * associated WebSocket URL. Uses user selection from `sessionService`
 * in order to filter down to an appropriate topic.
 *
 * @param {vista/sessions.SessionService} sessions service providing
 *        information about user-selected topics/sessions
 * @constructor
 * @implements {TelemetryService}
 * @memberof vista/telemetry
 */

class MCWSStreamProvider {
  constructor(openmct, vistaTime, options) {
    this.openmct = openmct;
    this.vistaTime = function () {
      return vistaTime;
    };
    this.options = options;

    this.sessions = sessionService();
    this.filterService = filterService();

    this.subscriptions = {};
    this.requests = {};

    this.subscriptionMCWSFilterDelay = options?.time?.subscriptionMCWSFilterDelay;
  }

  processGlobalStaleness(data, latestTimestamp) {
    const globalStaleness = GlobalStaleness();

    if (globalStaleness === null) {
      return;
    }

    if (!globalStaleness.latestTimestamp) {
      globalStaleness.updateLatestTimestamp(latestTimestamp);
      return;
    }

    if (globalStaleness.isStale(latestTimestamp)) {
      data.forEach((datum) => {
        datum.isStale = 1;
      });
    } else {
      data.forEach((datum) => {
        datum.isStale = 0;
      });
    }

    globalStaleness.updateLatestTimestamp(latestTimestamp);
  }

  onmessage(message) {
    const data = message.data;
    const { url, key, values } = data;
    const subscriptions = (this.subscriptions[url] ?? {})[key] ?? [];
    const timestamp = Date.now();

    this.processGlobalStaleness(values ?? [], timestamp);

    subscriptions.forEach(function (subscription) {
      // ticks the clock for ert, scet, and sclk if they are present
      this.vistaTime().update(values[0]);
      values.forEach(subscription.callback);
    }, this);

    //Communicate websocket timeout and errors to users
    if (data.onclose && data.code === 1006) {
      const message = `Real-time data connection lost - data may not be displayed as expected. Code: 1006`;

      this.openmct.notifications.error(message);
      console.error(message);
    } else if (data.onerror) {
      this.openmct.notifications.error(
        `Websocket Error for ${url}?${data.query}, please see console for details`
      );
      console.error(`Websocket Error - Code: ${data.code}, Error: ${data.reason}`);
    }
  }

  worker() {
    const worker = runMCWSStreamWorker();

    worker.onmessage = this.onmessage.bind(this);

    // cache worker
    this.worker = function () {
      return worker;
    };

    // topic
    const updateTopic = function (newValue) {
      this.notifyWorker('topic', newValue);
    }.bind(this);

    updateTopic(this.sessions.getActiveTopicOrSession());

    this.sessions.listen(updateTopic);

    // global filters
    if (this.filterService) {
      const updateGlobalFilters = function (filters) {
        const serializedFilters = this.serializeFilters(filters);
        this.notifyWorker('globalFilters', serializedFilters);
      }.bind(this);

      updateGlobalFilters(this.filterService.getActiveFilters());

      this.filterService.on('update', updateGlobalFilters);
    }

    return worker;
  }

  /**
   * Post a message to the associated worker.
   * @param {string} key identifier for the type of message
   * @param {string} value data associated with the message
   * @private
   */
  notifyWorker(key, value) {
    this.worker().postMessage({ key, value });
  }

  /**
   * Initialize the subscription for a given URL and key.
   * @param {string} url the URL to initialize
   * @param {string} key the key to initialize
   * @private
   */
  initializeSubscription(url, key) {
    if (!Object.hasOwn(this.subscriptions, url)) {
      this.subscriptions[url] = {};
    }
    if (!Object.hasOwn(this.subscriptions[url], key)) {
      this.subscriptions[url][key] = [];
    }
  }

  /**
   * Add a callback function associated with a specific domain object.
   * @param {DomainObject} domainObject the requested object
   * @param {Function} callback the callback to add
   * @private
   */
  addCallback(domainObject, callback) {
    const url = this.getUrl(domainObject);
    const key = this.getKey(domainObject);

    this.initializeSubscription(url, key);

    this.subscriptions[url][key].push({
      callback,
      domainObject
    });
  }

  /**
   * Remove a callback function associated with a specific domain object.
   * @param {DomainObject} domainObject the requested object
   * @param {Function} callback the callback to remove
   * @private
   */
  removeCallback(domainObject, callback) {
    const url = this.getUrl(domainObject);
    const key = this.getKey(domainObject);

    this.initializeSubscription(url, key);

    this.subscriptions[url][key] = this.subscriptions[url][key].filter(
      (c) => c.callback !== callback
    );

    if (this.subscriptions[url][key].length < 1) {
      delete this.subscriptions[url][key];

      if (Object.keys(this.subscriptions[url]).length < 1) {
        delete this.subscriptions[url];
      }
    }
  }

  /**
   * Check if the provider supports subscribing to a domain object.
   * @param {DomainObject} domainObject the requested object
   * @returns {boolean} true if the provider supports subscribing, false otherwise
   * @private
   */
  supportsSubscribe(domainObject) {
    return Boolean(this.getUrl(domainObject));
  }

  /**
   * Subscribe to a domain object.
   * @param {DomainObject} domainObject the requested object
   * @param {Function} callback the callback to add
   * @param {Object} options additional options
   * @returns {Function} a function to unsubscribe
   * @private
   */
  subscribe(domainObject, callback, options) {
    if (options) {
      options = { ...options };
      if (options.filters) {
        options.filters = this.removeFiltersIfAllSelected(domainObject, options.filters);
      }
    }

    let active = true;
    const message = {
      url: this.getUrl(domainObject),
      key: this.getKey(domainObject),
      property: this.getProperty(domainObject),
      mcwsVersion: domainObject.telemetry.mcwsVersion,
      extraFilterTerms: options?.filters ? this.serializeFilters(options.filters) : undefined,
      subscriptionMCWSFilterDelay: this.subscriptionMCWSFilterDelay
    };

    function unsubscribe() {
      if (!active) {
        throw new Error('Tried to unsubscribe more than once.');
      }

      this.removeCallback(domainObject, callback);
      this.notifyWorker('unsubscribe', message);
      active = false;
    }

    this.addCallback(domainObject, callback);
    this.notifyWorker('subscribe', message);

    return unsubscribe.bind(this);
  }

  /**
   * Remove filters if all selected.
   * @param {DomainObject} domainObject the requested object
   * @param {Object} filters the filters to remove
   * @returns {Object} the updated filters
   * @private
   */
  removeFiltersIfAllSelected(domainObject, filters) {
    let valuesWithFilters = this.openmct.telemetry
      .getMetadata(domainObject)
      .values()
      .filter((metadatum) => metadatum.filters !== undefined)
      .reduce((map, metadatum) => {
        map[metadatum.key] = metadatum.filters;
        return map;
      }, {});

    Object.keys(filters).forEach((key) => {
      let metadataFilters = valuesWithFilters[key];
      if (metadataFilters) {
        metadataFilters.forEach((filter) => {
          if (filter.possibleValues) {
            let allSelected = filter.possibleValues.every((possibleValue) => {
              return filters[key].equals && filters[key].equals.includes(possibleValue.value);
            });
            if (allSelected) {
              filters[key] = {};
            }
          }
        });
      }
    });

    return filters;
  }

  serializeFilters(filters) {
    let attributeKeys = Object.keys(filters);
    let keysToFilterStringsMap = attributeKeys.reduce((extraFilterTerms, attributeKey) => {
      let filtersForAttribute = filters[attributeKey];
      extraFilterTerms[attributeKey] = Object.keys(filtersForAttribute).reduce(
        (filterString, comparator) => {
          if (comparator === 'equals') {
            let equalsFilters;
            if (filtersForAttribute[comparator] instanceof Array) {
              equalsFilters = `${filtersForAttribute[comparator].join(',')}`;
            } else {
              equalsFilters = `${filtersForAttribute[comparator]}`;
            }
            if (equalsFilters !== '') filterString += `(${equalsFilters})`;
          }
          return filterString;
        },
        ''
      );
      return extraFilterTerms;
    }, {});
    return keysToFilterStringsMap;
  }

  /**
   * Get the WebSocket URL for streaming data associated with this request.
   * Intended to be overridden, e.g. for EVR stream provider.
   * @private
   * @param {DomainObject} domainObject the requested object
   * @returns {string} the WebSocket URL
   */
  getUrl(domainObject) {
    throw new Error('getUrl not implemented.');
  }

  /**
   * Get a key which identifies this request (relative to other requests
   * from the same source), such as a channel ID.
   * @private
   * @param {DomainObject} domainObject the requested object
   * @returns {string} the key
   */
  getKey(domainObject) {
    throw new Error('getKey not implemented.');
  }

  /**
   * Get the name of the property of telemetry data points which will
   * contain keys corresponding to original requests.
   * @see {vista/telemetry.MCWSStreamProvider#getKey}
   * @private
   * @returns {string} the property name
   */
  getProperty(domainObject) {
    throw new Error('getProperty not implemented.');
  }
}

export default MCWSStreamProvider;
