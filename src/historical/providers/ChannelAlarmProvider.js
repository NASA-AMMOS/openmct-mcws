import mcws from 'services/mcws/mcws.js';
import { setSortFilter, setMaxResults } from '../../utils/utils.js';

class ChannelAlarmProvider {
  supportsRequest(domainObject, options) {
    return (
      domainObject.identifier.namespace === 'vista-channel-alarms' &&
      domainObject.telemetry &&
      domainObject.telemetry.channelHistoricalUrl &&
      domainObject.telemetry.alarmLevel
    );
  }

  request(domainObject, options, params) {
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
}

export default new ChannelAlarmProvider();