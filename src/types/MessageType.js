define([
    './VISTAType'
], function (
    VISTAType
) {
    const key = 'vista.message';
    var MessageType = new VISTAType({
        key: key,
        name: "Messages",
        cssClass: "icon-telemetry",
        pattern: /^message:([a-zA-Z0-9\-:]+)/,
        transform: function (match) {
            return {
                datasetIdentifier: VISTAType.toIdentifier(match[1])
            };
        },
        makeId: function (datasetIdentifier) {
            return "message:" + VISTAType.toKeyString(datasetIdentifier);
        },
        makeObject: function (dataset, data) {
            return dataset.load()
                .then(function () {
                    let object = {
                        name: "Messages",
                        type: this.key,
                        location: this.getLocation(dataset, data),
                        telemetry: {
                            messageStreamUrl: dataset.options.messageStreamUrl,
                            realtimeOnly: true,
                            mcwsVersion: dataset.version,
                            //if false will automatically add standard domains (SCET, SCLK, etc)
                            ignoreDomains: true,
                            values: [{
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
                            }, {
                                key: 'summary',
                                name: 'Message Summary',
                                format: 'string'
                            }]
                        }
                    };

                    // only add filters property to message_type value if configured in openmctMCWSConfig
                    // to prevent filter UI component from rendering if no filters exist
                    if (window.openmctMCWSConfig.messageTypeFilters && window.openmctMCWSConfig.messageTypeFilters.length) {
                        object.telemetry.values.forEach((obj, index) => {
                            if (obj.key === 'message_type') {
                                object.telemetry.values[index].filters = [{
                                    comparator: 'equals',
                                    possibleValues: window.openmctMCWSConfig.messageTypeFilters
                                }];
                            }
                        });
                    }

                    return object;
                }.bind(this));
        }
    });

    return MessageType;
});
