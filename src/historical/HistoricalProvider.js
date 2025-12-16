import sessionService from 'services/session/SessionService.js';
import filterService from 'services/filtering/FilterService.js';
import UTCDayOfYearFormat from '../formats/UTCDayOfYearFormat.js';
import moment from 'moment';
import channelLADProvider from './providers/ChannelLadProvider.js';
import minMaxProvider from './providers/MinMaxProvider.js';
import evrProvider from './providers/EvrProvider.js';
import dataProductProvider from './providers/DataProductProvider.js';
import channelAlarmProvider from './providers/ChannelAlarmProvider.js';
import commandEventsProvider from './providers/CommandEventsProvider.js';
import headerChannelsHistoricalProvider from './providers/HeaderChannelsHistoricalProvider.js';
import channelHistoricalProvider from './providers/ChannelHistoricalProvider.js';

import { debounce } from '../utils/utils.js';

const UTC_FORMAT_KEY = window.openmctMCWSConfig?.time?.utcFormat;

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
