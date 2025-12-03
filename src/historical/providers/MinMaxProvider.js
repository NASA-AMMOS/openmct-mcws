import mcws from 'services/mcws/mcws.js';
import types from '../../types/types.js';
import { groupBy, keyBy, setSortFilter } from '../../utils/utils.js';

class MinMaxProvider {
  constructor() {
    this.isMinMaxProvider = true;
  }

  supportsRequest(domainObject, request) {
    return (
      domainObject.type === types.Channel.key &&
      domainObject.telemetry &&
      domainObject.telemetry.channelMinMaxUrl &&
      request.size > 1 &&
      request.strategy === 'minmax'
    );
  }

  batchId(domainObject, options) {
    return [
      domainObject.telemetry.channelLADUrl,
      options.domain,
      options.start,
      options.end,
      options.size
    ];
  }

  batchRequest(batch) {
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
  }
}

export default new MinMaxProvider();