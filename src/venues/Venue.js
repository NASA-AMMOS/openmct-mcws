import SessionService from 'services/session/SessionService';
import constants from '../constants';

const ADDITIONAL_FIELDS = [
  'prefix',
  'mcwsRootUrl',
  'sessionUrl',
  'sessionLADUrl',
  'packetSummaryEventStreamUrl',
  'commandEventUrl',
  'commandEventStreamUrl'
];
const DATASET_FIELDS = [
  ...ADDITIONAL_FIELDS,
  ...constants.DICTIONARY_PROPERTIES,
  ...constants.EVR_PROPERTIES,
  ...constants.CHANNEL_PROPERTIES,
  ...constants.CHANNEL_TAXONOMY_PROPERTIES,
  ...constants.DATA_PRODUCT_PROPERTIES,
  ...constants.PACKET_PROPERTIES,
  ...constants.WEBSOCKET_STREAM_URL_KEYS
];

class Venue {
  constructor(configuration) {
    this.host = configuration.host;
    this.domainObject = DATASET_FIELDS.reduce((domainObject, field) => {
      if (Object.hasOwn(configuration, field)) {
        domainObject[field] = configuration[field];
      }

      return domainObject;
    }, {});
    this.domainObject.type = 'vista.dataset';
    this.domainObject.name = configuration.name;
    this.sessionService = new SessionService();
  }

  allowsRealtime() {
    return Boolean(this.domainObject.sessionLADUrl);
  }

  getActiveSessions() {
    return this.sessionService.getActiveSessions(this.domainObject.sessionLADUrl);
  }

  getdomainObject() {
    const domainObject = JSON.parse(JSON.stringify(this.domainObject));
    domainObject.name += ' Dataset';

    return domainObject;
  }
}

export default Venue;
