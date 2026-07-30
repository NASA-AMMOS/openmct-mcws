import mcws from 'services/mcws/mcws.js';
import types from '../../types/types.js';
import { groupBy, keyBy, setSortFilter } from '../../utils/utils.js';



class ChannelLadProvider {
  supportsRequest(domainObject, request) {
    return (
      domainObject.type === types.Channel.key &&
      domainObject.telemetry &&
      (domainObject.telemetry.channelLADUrl || domainObject.telemetry.channelHistoricalUrl) &&
      (request.strategy === 'latest' || request.size === 1)
    );
  }

  batchId(domainObject, options) {
    return [domainObject.telemetry.channelLADUrl, options.domain, options.filters];
  }

  batchRequest(batch) {
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
}

export default new ChannelLadProvider();
