import mcws from 'services/mcws/mcws.js';
import { setSortFilter, setMaxResults } from '../../utils/utils.js';

class CommandEventsProvider {
  constructor() {
    this.exclusiveDomains = ['ert'];
  }

  supportsRequest(domainObject, options) {
    return domainObject.telemetry && !!domainObject.telemetry.commandEventUrl;
  }

  request(domainObject, options, params) {
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
  }
}

export default new CommandEventsProvider();