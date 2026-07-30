import mcws from 'services/mcws/mcws.js';
import { setSortFilter, setMaxResults, isLADQuery } from '../../utils/utils.js';

class EvrProvider {
  supportsRequest(domainObject, options) {
    const hasTelemetry = Boolean(domainObject.telemetry);
    const hasEvrHistoricalUrl =
      hasTelemetry && Boolean(domainObject.telemetry.evrHistoricalUrl);
    const hasEvrLADUrl = hasTelemetry && Boolean(domainObject.telemetry.evrLADUrl);

    return hasEvrHistoricalUrl || (hasEvrLADUrl && isLADQuery(options));
  }

  request(domainObject, options, params) {
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
}

export default new EvrProvider();