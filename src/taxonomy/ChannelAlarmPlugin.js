define([

], function (

) {

    function ChannelAlarmPlugin(domains, cache) {
        var values = domains.concat([
            {
                name: "Channel",
                key: "channel_id",
                type: "id"
            },
            {
                name: "DN",
                key: "dn",
                type: "dn",
                hints: {
                    range: 0
                }
            },
            {
                name: "EU",
                key: "eu",
                type: "eu",
                hints: {
                    range: 1
                }
            },
            {
                name: "DN Alarm State",
                key: "dn_alarm_state",
                type: "state"
            },
            {
                name: "EU Alarm State",
                key: "eu_alarm_state",
                type: "state"
            },
            {
                name: "Realtime",
                key: "realtime",
                filters: [
                    {
                        comparator: 'equals',
                        possibleValues: [{value: true, label: "Realtime"}, {value: false, label: "Recorded"}]
                    }
                ]
            }
        ]);

        return function install(openmct) {
            openmct.types.addType('vista.channel.alarmNode', {
                cssClass: 'icon-dictionary',
                initialize: function (object) {
                    object.telemetry = {};
                }
            });

            openmct.types.addType('vista.channel.alarms', {
                cssClass: 'icon-dictionary'
            });

            openmct.composition.addProvider({
                appliesTo: function (domainObject) {
                    return domainObject.type === 'vista.channel.alarms';
                },
                load: function (domainObject) {
                    return Promise.resolve([
                        {
                            namespace: 'vista-channel-alarms',
                            key: domainObject.identifier.key + ':red'
                        },
                        {
                            namespace: 'vista-channel-alarms',
                            key: domainObject.identifier.key + ':yellow'
                        },
                        {
                            namespace: 'vista-channel-alarms',
                            key: domainObject.identifier.key + ':any'
                        }
                    ])
                }
            });

            openmct.objects.addProvider('vista-channel-alarms', {
                get: function (identifier) {
                    var datasetId = identifier.key.replace(/:red$|:yellow$|:any$/g, '');
                    var parentIdentifier = 'vista-channel-alarms:' + datasetId;
                    var datasetIdentifier = {
                        key: datasetId.split(':', 2)[1],
                        namespace: datasetId.split(':', 2)[0]
                    };
                    return cache.get(datasetIdentifier)
                        .then(function (dataset) {
                            var prefix = '';
                            if (dataset.options.prefix) {
                                prefix = dataset.options.prefix + ' ';
                            }
                            if (identifier.key.indexOf(':red') !== -1) {
                                return {
                                    type: 'vista.channel.alarmNode',
                                    location: parentIdentifier,
                                    identifier: identifier,
                                    telemetry: {
                                        channelHistoricalUrl: dataset.options.channelHistoricalUrl,
                                        alarmMessageStreamUrl: dataset.options.alarmMessageStreamUrl,
                                        mcwsVersion: dataset.version,
                                        alarmLevel: 'red',
                                        values: values,
                                        definition: {}
                                    },
                                    name: prefix + 'Red Alarms'
                                };
                            } else if (identifier.key.indexOf(':yellow') !== -1) {
                                return {
                                    type: 'vista.channel.alarmNode',
                                    location: parentIdentifier,
                                    identifier: identifier,
                                    telemetry: {
                                        channelHistoricalUrl: dataset.options.channelHistoricalUrl,
                                        alarmMessageStreamUrl: dataset.options.alarmMessageStreamUrl,
                                        mcwsVersion: dataset.version,
                                        alarmLevel: 'yellow',
                                        values: values,
                                        definition: {}
                                    },
                                    name: prefix + 'Yellow Alarms'
                                };
                            } else if (identifier.key.indexOf(':any') !== -1) {
                                return {
                                    type: 'vista.channel.alarmNode',
                                    location: parentIdentifier,
                                    identifier: identifier,
                                    telemetry: {
                                        channelHistoricalUrl: dataset.options.channelHistoricalUrl,
                                        alarmMessageStreamUrl: dataset.options.alarmMessageStreamUrl,
                                        mcwsVersion: dataset.version,
                                        alarmLevel: 'any',
                                        values: values,
                                        definition: {}
                                    },
                                    name: prefix + 'Any Alarms'
                                };
                            } else {
                                return {
                                    type: 'vista.channel.alarms',
                                    location: identifier.key,
                                    identifier: identifier,
                                    name: prefix + 'Channel Alarms'
                                };
                            }
                        });
                }
            });

            let wrappedGet = openmct.objectViews.get;
            openmct.objectViews.get = function (domainObject) {
                return wrappedGet.apply(this, arguments).filter(
                    viewProvider => (
                        domainObject.type !== 'vista.channel.alarmNode'
                        || (domainObject.type === 'vista.channel.alarmNode' && viewProvider.key === 'table'))
                );
            };
        };
    }


    return ChannelAlarmPlugin;
});
