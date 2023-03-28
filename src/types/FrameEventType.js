define([
    './VISTAType',
    '../constants'
], function (
    VISTAType,
    constants
) {

    var FrameEventType = new VISTAType({
        key: "vista.frameEvent",
        name: "Frame Events",
        cssClass: "icon-telemetry",
        pattern: /^frame-event:([a-zA-Z0-9\-:]+)/,
        transform: function (match) {
            return {
                datasetIdentifier: VISTAType.toIdentifier(match[1])
            };
        },
        makeId: function (datasetIdentifier) {
            return "frame-event:" + VISTAType.toKeyString(datasetIdentifier);
        },
        makeFilterIdentifier: function(datasetIdentifier, eventType) {
            return {
                namespace: 'vista-frame-event-filter',
                key: eventType  + ':' + VISTAType.toKeyString(datasetIdentifier)
            };
        },
        makeObject: function (dataset, data) {
            return dataset.load()
                .then(function () {
                    var composition = Object.keys(constants.FRAME_EVENT_TYPES).map(eventType => {
                        return this.makeFilterIdentifier(data.datasetIdentifier, eventType);
                    });

                    return {
                        name: "Frame Events",
                        type: this.key,
                        location: this.getLocation(dataset, data),
                        composition: composition,
                        telemetry: {
                            frameEventStreamUrl: dataset.options.frameEventStreamUrl,
                            realtimeOnly: true,
                            mcwsVersion: dataset.version,
                            ignoreDomains: true,
                            values: [
                                {
                                    key: 'ert',
                                    source: 'event_time',
                                    name: 'Event Time',
                                    format: 'utc.day-of-year',
                                    hints: {
                                        domain: 1
                                    }
                                },
                                {
                                    key: 'message_type',
                                    name: 'Message Type',
                                    format: 'string'
                                },
                                {
                                    key: 'summary',
                                    name: 'Summary',
                                    format: 'string'
                                },
                                {
                                    key: 'vcid',
                                    name: 'VCID',
                                    format: 'number'
                                },
                                {
                                    key: 'scid',
                                    name: 'SCID',
                                    format: 'number'
                                },
                                {
                                    key: 'reason',
                                    name: 'Reason',
                                    format: 'string'
                                }
                            ]
                        }
                    };
                }.bind(this));
        }
    });

    return FrameEventType;
});
