import mcws from 'services/mcws/mcws.js';
import types from '../../types/types.js';
import { groupBy, keyBy, setSortFilter, setMaxResults } from '../../utils/utils.js';

class ChannelHistoricalProvider {
  supportsRequest(domainObject, request) {
    return (
      domainObject.type === types.Channel.key &&
      domainObject.telemetry &&
      domainObject.telemetry.channelHistoricalUrl &&
      (request.strategy === 'minmax' ? !domainObject.telemetry.channelMinMaxUrl : true) &&
      request.size !== 1
    );
  }

  get batchId() {
    if (window.openmctMCWSConfig?.batchHistoricalChannelQueries === true) {
      return (domainObject, options) => {
        return [domainObject.telemetry.channelHistoricalUrl, options.domain, options.filters];
      };
    }
    return undefined;
  }

  batchRequest(batch) {
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
  }

  request(domainObject, options, params) {
    params.filter.channel_id = domainObject.telemetry.channel_id;
    setSortFilter(params);
    setMaxResults(domainObject, options, params);

    return mcws
      .dataTable(domainObject.telemetry.channelHistoricalUrl, { signal: options.signal })
      .read(params);
  }
}

export default new ChannelHistoricalProvider();