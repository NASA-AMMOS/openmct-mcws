define([
    'services/session/SessionService'
], function (
    sessionServiceDefault
) {
    const SessionService = sessionServiceDefault.default;
    const DATASET_FIELDS = [
        "prefix",
        "mcwsRootUrl",
        "channelDictionaryUrl",
        "channelEnumerationDictionaryUrl",
        "channelHistoricalUrl",
        "channelMinMaxUrl",
        "channelLADUrl",
        "channelStreamUrl",
        "sessionUrl",
        "sessionLADUrl",
        "eventRecordDictionaryUrl",
        "evrHistoricalUrl",
        "evrLADUrl",
        "evrStreamUrl",
        "dataProductUrl",
        "dataProductContentUrl",
        "dataProductStreamUrl",
        "packetUrl",
        "packetContentUrl",
        "packetSummaryEventStreamUrl",
        "commandEventUrl",
        "commandEventStreamUrl",
        "messageStreamUrl",
        "frameSummaryStreamUrl",
    ];

    function Venue(configuration, openmct) {
        this.host = configuration.host;
        this.model = DATASET_FIELDS.reduce(function (m, field) {
            if (configuration.hasOwnProperty(field)) {
                m[field] = configuration[field];
            }
            return m;
        }, {});
        this.model.type = 'vista.dataset';
        this.model.name = configuration.name;
        this.sessionService = SessionService();
    }

    Venue.prototype.allowsRealtime = function () {
        return !!this.model.sessionLADUrl;
    }

    Venue.prototype.getActiveSessions = function () {
        return this.sessionService.getActiveSessions(this.model.sessionLADUrl);
    }

    Venue.prototype.getModel = function () {
        var model = JSON.parse(JSON.stringify(this.model));
        model.name = model.name + ' Dataset';
        return model;
    }

    return Venue;
});
