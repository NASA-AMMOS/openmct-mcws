import mcws from 'services/mcws/mcws.js';
import { setSortFilter, setMaxResults } from '../../utils/utils.js';

class DataProductProvider {
  supportsRequest(domainObject, options) {
    return domainObject.telemetry && !!domainObject.telemetry.dataProductUrl;
  }

  request(domainObject, options, params) {
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
}

export default new DataProductProvider();