import mcws from 'services/mcws/mcws.js';
import sessionService from 'services/session/SessionService.js';
import filterService from 'services/filtering/FilterService.js';
import types from '../types/types.js';
import UTCDayOfYearFormat from '../formats/UTCDayOfYearFormat.js';
import moment from 'moment';

const UTC_FORMAT_KEY = window.openmctMCWSConfig?.time?.utcFormat;

// Helper function to replace lodash groupBy
function groupBy(array, key) {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
}

// Helper function to replace lodash keyBy
function keyBy(array, key) {
  return array.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key];
    result[groupKey] = item;
    return result;
  }, {});
}

// Helper function to replace lodash debounce
function debounce(func, wait = 0) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// CHANNEL LAD PROVIDER
const channelLADProvider = {
  supportsRequest: function (domainObject, request) {
    return (
      domainObject.type === types.Channel.key &&
      domainObject.telemetry &&
      (domainObject.telemetry.channelLADUrl || domainObject.telemetry.channelHistoricalUrl) &&
      (request.strategy === 'latest' || request.size === 1)
    );
  },
  batchId: function (domainObject, options) {
    return [domainObject.telemetry.channelLADUrl, options.domain, options.filters];
  },
  batchRequest: function (batch) {
    const requests = Object.values(batch.requestsById);
    const params = requests[0].params;
    const options = requests[0].options;

    params.lad_type = params.sort;
    params.select =
      '(dn,eu,channel_id,ert,scet,sclk,lst,record_type,dn_alarm_state,eu_alarm_state,module,realtime,dss_id)';
    params.filter.channel_id__in = requests.map((req) => req.domainObject.telemetry.channel_id);
    setSortFilter(params);

    const ladURL = requests[0].domainObject.telemetry.channelLADUrl;
    const fallbackHistoricalURL = requests[0].domainObject.telemetry.channelHistoricalUrl;
    let requestURL;

    if (!ladURL) {
      requestURL = fallbackHistoricalURL;
      delete params.lad_type;
    } else {
      requestURL = ladURL;
    }

    mcws
      .dataTable(requestURL, { signal: options.signal })
      .read(params)
      .then((res) => {
        const valuesByChannelId = groupBy(res, 'channel_id');
        const toFulfill = keyBy(requests, (req) => req.domainObject.telemetry.channel_id);

        Object.entries(valuesByChannelId).forEach(([id, values]) => {
          toFulfill[id].resolve(values);
          delete toFulfill[id];
        });
        Object.values(toFulfill).forEach((request) => {
          request.resolve([]);
        });
      })
      .catch((reason) => {
        requests.forEach((request) => request.reject(reason));
      });
  }
};

// MINMAX PROVIDER
const minMaxProvider = {
  supportsRequest: function (domainObject, request) {
    return (
      domainObject.type === types.Channel.key &&
      domainObject.telemetry &&
      domainObject.telemetry.channelMinMaxUrl &&
      request.size > 1 &&
      request.strategy === 'minmax'
    );
  },
  batchId: function (domainObject, options) {
    return [
      domainObject.telemetry.channelLADUrl,
      options.domain,
      options.start,
      options.end,
      options.size
    ];
  },
  batchRequest: function (batch) {
    const requests = Object.values(batch.requestsById);
    const params = requests[0].params;
    const options = requests[0].options;

    params.minmax =
      '(' + [requests[0].options.size, requests[0].options.domain, 'eu_or_dn'].join(',') + ')';
    params.select =
      '(dn,eu,channel_id,ert,scet,sclk,lst,record_type,eu_or_dn,dn_alarm_state,eu_alarm_state)';
    params.filter.channel_id__in = requests.map((req) => req.domainObject.telemetry.channel_id);
    setSortFilter(params);

    mcws
      .dataTable(requests[0].domainObject.telemetry.channelMinMaxUrl, {
        signal: options.signal
      })
      .read(params)
      .then((res) => {
        const valuesByChannelId = groupBy(res, 'channel_id');
        const toFulfill = keyBy(requests, (req) => req.domainObject.telemetry.channel_id);

        Object.entries(valuesByChannelId).forEach(([id, values]) => {
          toFulfill[id].resolve(values);
          delete toFulfill[id];
        });
        Object.values(toFulfill).forEach((request) => {
          request.resolve([]);
        });
      })
      .catch((reason) => {
        requests.forEach((request) => request.reject(reason));
      });
  },
  isMinMaxProvider: true
};

// EVR PROVIDER
const evrProvider = {
  supportsRequest: function (domainObject, options) {
    const hasTelemetry = Boolean(domainObject.telemetry);
    const hasEvrHistoricalUrl =
      hasTelemetry && Boolean(domainObject.telemetry.evrHistoricalUrl);
    const hasEvrLADUrl = hasTelemetry && Boolean(domainObject.telemetry.evrLADUrl);

    return hasEvrHistoricalUrl || (hasEvrLADUrl && isLADQuery(options));
  },
  request: function (domainObject, options, params) {
    const evrHistoricalUrl = domainObject.telemetry.evrHistoricalUrl;
    const evrLADUrl = domainObject.telemetry.evrLADUrl;

    let url = evrHistoricalUrl;

    if (evrLADUrl && isLADQuery(options)) {
      url = evrLADUrl;
      params.lad_type = params.sort;

      /*
       * For LAD queries by name,
       * MCWS and AMPCS also requires a level
       */
      if (domainObject.telemetry.evr_name) {
        params.filter.level = '*';
      }
    }

    if (domainObject.telemetry.level) {
      params.filter.level = domainObject.telemetry.level;
    }

    if (domainObject.telemetry.module) {
      params.filter.module = domainObject.telemetry.module;
    }

    if (domainObject.telemetry.evr_name) {
      params.filter.name = domainObject.telemetry.evr_name;
    }

    setMaxResults(domainObject, options, params);

    setSortFilter(params);

    return mcws.dataTable(url, { signal: options.signal }).read(params);
  }
};

// DATA PRODUCT PROVIDER
const dataProductProvider = {
  supportsRequest: function (domainObject, options) {
    return domainObject.telemetry && !!domainObject.telemetry.dataProductUrl;
  },
  request: function (domainObject, options, params) {
    setMaxResults(domainObject, options, params);
    setSortFilter(params);

    const promise = mcws
      .dataTable(domainObject.telemetry.dataProductUrl, { signal: options.signal })
      .read(params);

    if (domainObject.type === 'vista.dataProducts') {
      return promise.then((results) => {
        results.forEach((datum) => {
          const sessionId = datum.session_id;
          if (datum.unique_name !== undefined) {
            const uniqueName = datum.unique_name.replace(/\.dat$/, '');
            const filter = '(session_id=' + sessionId + ',unique_name=' + uniqueName + ')';
            const params = '?filter=' + filter + '&filetype=';
            const base_url = domainObject.telemetry.dataProductContentUrl + params;
            datum.emd_url = base_url + '.emd';
            datum.emd_preview = base_url + '.emd';
            datum.dat_url = base_url + '.dat';
            datum.txt_url = base_url.replace('DataProductContent', 'DataProductView') + '.dat';
          }
        });
        return results;
      });
    }
    return promise;
  }
};

// CHANNEL ALARM PROVIDER
const channelAlarmProvider = {
  supportsRequest: function (domainObject, options) {
    return (
      domainObject.identifier.namespace === 'vista-channel-alarms' &&
      domainObject.telemetry &&
      domainObject.telemetry.channelHistoricalUrl &&
      domainObject.telemetry.alarmLevel
    );
  },
  request: function (domainObject, options, params) {
    setMaxResults(domainObject, options, params);
    setSortFilter(params);

    const dnQueryParams = JSON.parse(JSON.stringify(params));
    const euQueryParams = JSON.parse(JSON.stringify(params));

    if (domainObject.telemetry.alarmLevel === 'any') {
      dnQueryParams.filter.dn_alarm_state__in = ['RED', 'YELLOW'];
      euQueryParams.filter.eu_alarm_state__in = ['RED', 'YELLOW'];
    } else {
      dnQueryParams.filter.dn_alarm_state = domainObject.telemetry.alarmLevel.toUpperCase();

      euQueryParams.filter.eu_alarm_state = domainObject.telemetry.alarmLevel.toUpperCase();
    }

    const dataTable = mcws.dataTable(domainObject.telemetry.channelHistoricalUrl, {
      signal: options.signal
    });

    return Promise.all([dataTable.read(dnQueryParams), dataTable.read(euQueryParams)]).then(
      (results) => {
        return results[0].concat(results[1]);
      }
    );
  }
};

// COMMAND EVENTS PROVIDER
const commandEventsProvider = {
  supportsRequest: function (domainObject, options) {
    return domainObject.telemetry && !!domainObject.telemetry.commandEventUrl;
  },
  request: function (domainObject, options, params) {
    setMaxResults(domainObject, options, params);
    params.sort = 'event_time';
    setSortFilter(params);

    if (options.domain === 'ert') {
      params.filter.event_time__gte = params.filter[options.domain + '__gte'];
      params.filter.event_time__lte = params.filter[options.domain + '__lte'];
    }

    delete params.filter[options.domain + '__gte'];
    delete params.filter[options.domain + '__lte'];

    return mcws
      .dataTable(domainObject.telemetry.commandEventUrl, { signal: options.signal })
      .read(params)
      .then(
        (res) => {
          return res;
        },
        (errorResponse) => {
          if (errorResponse.status === 400) {
            throw errorResponse;
          }

          return []; // TODO: better handling due to error.
        }
      );
  },
  exclusiveDomains: ['ert']
};

// HEADER CHANNELS HISTORICAL PROVIDER
const headerChannelsHistoricalProvider = {
  supportsRequest: function (domainObject, request) {
    return (
      domainObject.type === types.HeaderChannel.key &&
      domainObject.telemetry &&
      domainObject.telemetry.channelHistoricalUrl
    );
  },
  request: function (domainObject, options, params) {
    params.filter.channel_id = domainObject.telemetry.channel_id;
    setMaxResults(domainObject, options, params);
    setSortFilter(params);

    return mcws
      .dataTable(domainObject.telemetry.channelHistoricalUrl, { signal: options.signal })
      .read(params);
  }
};

// CHANNEL HISTORICAL PROVIDER
const channelHistoricalProvider = {
  supportsRequest: function (domainObject, request) {
    return (
      domainObject.type === types.Channel.key &&
      domainObject.telemetry &&
      domainObject.telemetry.channelHistoricalUrl &&
      (request.strategy === 'minmax' ? !domainObject.telemetry.channelMinMaxUrl : true) &&
      request.size !== 1
    );
  },
  batchRequest: function (batch) {
    const requests = Object.values(batch.requestsById);
    const params = requests[0].params;
    const options = requests[0].options;

    params.select =
      '(dn,eu,channel_id,ert,scet,sclk,lst,record_type,dn_alarm_state,eu_alarm_state,module,realtime,dss_id)';
    params.filter.channel_id__in = requests.map((req) => req.domainObject.telemetry.channel_id);
    setSortFilter(params);

    mcws
      .dataTable(requests[0].domainObject.telemetry.channelHistoricalUrl, {
        signal: options.signal
      })
      .read(params)
      .then((res) => {
        const valuesByChannelId = groupBy(res, 'channel_id');
        const toFulfill = keyBy(requests, (req) => req.domainObject.telemetry.channel_id);

        Object.entries(valuesByChannelId).forEach(([id, values]) => {
          toFulfill[id].resolve(values);
          delete toFulfill[id];
        });
        Object.values(toFulfill).forEach((request) => {
          request.resolve([]);
        });
      })
      .catch((reason) => {
        requests.forEach((request) => request.reject(reason));
      });
  },
  request: function (domainObject, options, params) {
    params.filter.channel_id = domainObject.telemetry.channel_id;
    setSortFilter(params);
    setMaxResults(domainObject, options, params);

    return mcws
      .dataTable(domainObject.telemetry.channelHistoricalUrl, { signal: options.signal })
      .read(params);
  }
};

if (window.openmctMCWSConfig?.batchHistoricalChannelQueries === true) {
  channelHistoricalProvider.batchId = function (domainObject, options) {
    return [domainObject.telemetry.channelHistoricalUrl, options.domain, options.filters];
  };
}

// Combine all providers into array
const PROVIDERS = [
  channelLADProvider,
  minMaxProvider,
  evrProvider,
  dataProductProvider,
  channelAlarmProvider,
  commandEventsProvider,
  headerChannelsHistoricalProvider,
  channelHistoricalProvider
];

function isLADQuery(options) {
  return options.strategy === 'latest';
}

function setMaxResults(domainObject, options, params) {
  if (
    domainObject.telemetry.mcwsVersion >= 3.2 &&
    options.strategy !== 'comprehensive' &&
    window.openmctMCWSConfig?.maxResults !== undefined
  ) {
    params.max_records = window.openmctMCWSConfig.maxResults;
  }
}

function setSortFilter(params) {
  if (window.openmctMCWSConfig?.disableSortParam === true) {
    delete params.sort;
  }
}

function padTime(time) {
  if (time < 10) {
    return `0${time}`;
  } else {
    return `${time}`;
  }
}

class HistoricalProvider {
  constructor(openmct) {
    this.openmct = openmct;
    this.timeFormatter = UTC_FORMAT_KEY
      ? this.openmct.telemetry.getFormatter(UTC_FORMAT_KEY)
      : new UTCDayOfYearFormat();
    this.clearAlert = this.clearAlert.bind(this);

    if (window.openmctMCWSConfig?.queryTimespanLimit !== undefined) {
      const duration = moment.duration(
        window.openmctMCWSConfig.queryTimespanLimit,
        'milliseconds'
      );
      const hours = padTime(Math.floor(duration.asHours()));
      const minutes = padTime(Math.floor(duration.minutes()));
      const seconds = padTime(Math.floor(duration.seconds()));

      this.formattedQueryTimespanLimit = `${hours}:${minutes}:${seconds} hrs`;
    }
  }

  supportsRequest(domainObject) {
    return ['vista', 'vista-channel-alarms', 'vista-frame-event-filter'].includes(
      domainObject.identifier.namespace
    );
  }

  dispatchBatch(provider, batchKey) {
    const batch = provider.batches[batchKey];
    provider.batchRequest(batch);
    delete provider.batches[batchKey];
  }

  doQueuedRequest(domainObject, options, params, provider) {
    if (!provider.batches) {
      provider.batches = {};
    }

    const batchKey = JSON.stringify(provider.batchId(domainObject, options));
    let batch = provider.batches[batchKey];

    if (!batch) {
      batch = provider.batches[batchKey] = {
        requestsById: {},
        dispatch: debounce(() => {
          this.dispatchBatch(provider, batchKey);
        }),
        provider: provider
      };
    }

    const oId = JSON.stringify(domainObject.identifier);
    let entry = batch.requestsById[oId];

    if (!entry) {
      entry = batch.requestsById[oId] = {
        domainObject: domainObject,
        options: options,
        params: params
      };
      entry.promise = new Promise((resolve, reject) => {
        entry.resolve = resolve;
        entry.reject = reject;
      });
    }
    batch.dispatch();
    return entry.promise;
  }

  isTimespanLimitExceeded(provider, options) {
    const domainsSupported = ['ert', 'scet', 'lmst'];

    if (
      domainsSupported.includes(options.domain) &&
      !provider.isMinMaxProvider &&
      options.size !== 1
    ) {
      if (options.end - options.start > window.openmctMCWSConfig?.queryTimespanLimit) {
        return true;
      }
    }

    return false;
  }

  request(domainObject, options) {
    let formatter;

    options = { ...options };

    const provider = PROVIDERS.filter((p) => p.supportsRequest(domainObject, options))[0];

    if (!provider) {
      return Promise.resolve([]);
    }

    if (this.formattedQueryTimespanLimit && this.isTimespanLimitExceeded(provider, options)) {
      const notificationMessage =
        'Time Conductor bounds exceed the limit of ' +
        this.formattedQueryTimespanLimit +
        ' - some views may not display data as expected.';

      this.openmct.notifications.error(notificationMessage);

      return Promise.resolve([]);
    }

    const params = {
      output: 'json',
      filter: {},
      sort: options.domain
    };

    if (options.domain === 'msl.sol' || options.domain === 'lmst') {
      params.sort = 'lst';
    }

    try {
      const metadata = this.openmct.telemetry.getMetadata(domainObject);
      const value = metadata.value(options.domain);

      if (value.key === 'scet' || value.key === 'ert') {
        formatter = this.timeFormatter;
      } else {
        formatter = this.openmct.telemetry.getValueFormatter(value);
      }

      if (options.domain === 'msl.sol' || options.domain === 'lmst') {
        options.domain = 'lst';
      }

      params.filter[options.domain + '__gte'] = formatter.format(options.start);
      params.filter[options.domain + '__lte'] = formatter.format(options.end);
    } catch (e) {
      // TODO: better handling when domain not available.
      console.error('Error requesting telemetry data for', domainObject, e);
    }

    const sessions = this.getSessionService();
    const sessionFilter = sessions.getHistoricalSessionFilter();

    if (sessionFilter) {
      params.filter.session_id = `(${sessionFilter.numbers.join(',')})`;
      params.filter.session_host = sessionFilter.host;
    } else if (
      window.openmctMCWSConfig?.sessions?.historicalSessionFilter?.disable !== true &&
      window.openmctMCWSConfig?.sessions?.historicalSessionFilter?.denyUnfilteredQueries === true
    ) {
      const notificationMessage =
        'Filtering by historical sessions is required for historical queries.';

      this.openmct.notifications.error(notificationMessage);

      return Promise.resolve([]);
    }

    if (this.isUnsupportedDomain(provider, options)) {
      const message = !sessionFilter
        ? `This view requires a session or supported time system for historical requests.`
        : `This view does not support ${options.domain}. Historical data might not match the time system.`;

      this.openmct.notifications.info(message);

      return Promise.resolve([]);
    }

    if (provider.isMinMaxProvider && this.hasFilters(options)) {
      this.showFiltersWarning();
    } else if (options.filters) {
      options.filters = this.removeFiltersIfAllSelected(domainObject, options.filters);
      Object.keys(options.filters).forEach((attributeKey) => {
        let filterValue = options.filters[attributeKey]['equals'];
        if (filterValue instanceof Array) {
          filterValue = filterValue.join(',');
        }
        if (filterValue !== undefined && filterValue !== '') {
          params.filter[attributeKey] = filterValue;
        }
      });
    }

    const filterServiceInstance = filterService();

    if (filterServiceInstance) {
      const globalFilters = filterServiceInstance.getActiveFilters();

      Object.entries(globalFilters).forEach(([key, filter]) => {
        const domainObjectFiltersKeys = Object.keys(params.filter);
        if (domainObjectFiltersKeys.includes(key)) {
          this.openmct.notifications.alert(
            `A view filter is overriding a global filter for '${key}'`
          );
        } else {
          let filterValue = filter['equals'];

          if (typeof filterValue === 'string' && filterValue.includes(',')) {
            filterValue = `(${filterValue})`;
          }

          params.filter[key] = filterValue;
        }
      });
    }

    if (provider.batchId) {
      return this.doQueuedRequest(domainObject, options, params, provider);
    }
    return provider.request(domainObject, options, params).catch(async (errorResponse) => {
      const responseBody = await errorResponse.text();
      const match = responseBody.match(/does not contain the specified parameter column: (\w+)/);

      if (match && filterServiceInstance.hasActiveFilters()) {
        this.openmct.notifications.error(
          `Error requesting telemetry data for ${domainObject.name}: Unsupported filter "${match[1]}". If set, please remove the global filter and retry.`
        );
      } else {
        throw errorResponse;
      }
    });
  }

  removeFiltersIfAllSelected(domainObject, filters) {
    const valuesWithFilters = this.openmct.telemetry
      .getMetadata(domainObject)
      .values()
      .filter((metadatum) => metadatum.filters !== undefined)
      .reduce((map, metadatum) => {
        map[metadatum.key] = metadatum.filters;
        return map;
      }, {});

    for (const key in filters) {
      const metadataFilters = valuesWithFilters[key];
      if (metadataFilters) {
        metadataFilters.forEach((filter) => {
          if (filter.possibleValues) {
            const allSelected = filter.possibleValues.every((possibleValue) => {
              return filters[key].equals && filters[key].equals.includes(possibleValue.value);
            });
            if (allSelected) {
              filters[key] = {};
            }
          }
        });
      }
    }

    return filters;
  }

  showFiltersWarning() {
    //Don't fill the notifications area with lots of warnings.
    if (!this.filteringAlert) {
      this.filteringAlert = this.openmct.notifications.alert(
        'Filtering is not supported with min-max requests. Showing unfiltered results.'
      );
      this.filteringAlert.on('destroy', this.clearAlert);
    }
  }

  clearAlert() {
    this.filteringAlert.off('destroy', this.clearAlert);
    delete this.filteringAlert;
  }

  hasFilters(options) {
    return (
      options.filters !== undefined &&
      Object.values(options.filters).some((filterValue) => {
        return filterValue && Object.keys(filterValue).length > 0;
      })
    );
  }

  isUnsupportedDomain(provider, options) {
    if (provider.exclusiveDomains && !provider.exclusiveDomains.includes(options.domain)) {
      return true;
    }

    return false;
  }

  getSessionService() {
    return sessionService();
  }
}

export default HistoricalProvider;
