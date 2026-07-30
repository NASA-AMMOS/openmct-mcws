import mcws from 'services/mcws/mcws.js';
import types from '../../types/types.js';
import { setSortFilter, setMaxResults } from '../../utils/utils.js';

class HeaderChannelsHistoricalProvider {
  supportsRequest(domainObject, request) {
    return (
      domainObject.type === types.HeaderChannel.key &&
      domainObject.telemetry &&
      domainObject.telemetry.channelHistoricalUrl
    );
  }

  request(domainObject, options, params) {
    params.filter.channel_id = domainObject.telemetry.channel_id;
    setMaxResults(domainObject, options, params);
    setSortFilter(params);

    return mcws
      .dataTable(domainObject.telemetry.channelHistoricalUrl, { signal: options.signal })
      .read(params);
  }
}

export default new HeaderChannelsHistoricalProvider();