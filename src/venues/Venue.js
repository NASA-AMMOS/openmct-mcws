import SessionService from 'services/session/SessionService';

const DATASET_FIELDS = [
    'prefix',
    'mcwsRootUrl',
    'channelDictionaryUrl',
    'channelEnumerationDictionaryUrl',
    'channelHistoricalUrl',
    'channelMinMaxUrl',
    'channelLADUrl',
    'channelStreamUrl',
    'sessionUrl',
    'sessionLADUrl',
    'eventRecordDictionaryUrl',
    'evrHistoricalUrl',
    'evrLADUrl',
    'evrStreamUrl',
    'dataProductUrl',
    'dataProductContentUrl',
    'dataProductStreamUrl',
    'packetUrl',
    'packetContentUrl',
    'packetSummaryEventStreamUrl',
    'commandEventUrl',
    'commandEventStreamUrl',
    'messageStreamUrl',
    'frameSummaryStreamUrl',
];

class Venue {
    constructor(configuration, openmct) {
        this.host = configuration.host;
        this.model = DATASET_FIELDS.reduce((model, field) => {
            if (configuration.hasOwnProperty(field)) {
                model[field] = configuration[field];
            }
            return model;
        }, {});
        this.model.type = 'vista.dataset';
        this.model.name = configuration.name;
        this.sessionService = new SessionService();
    }

    allowsRealtime() {
        return !!this.model.sessionLADUrl;
    }

    getActiveSessions() {
        return this.sessionService.getActiveSessions(this.model.sessionLADUrl);
    }

    getModel() {
        let model = JSON.parse(JSON.stringify(this.model));
        model.name += ' Dataset';
        return model;
    }
}

export default Venue;