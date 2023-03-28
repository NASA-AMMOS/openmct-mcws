define([
    './VISTAType',
    './ChannelGroupType',
    'lodash'
], function (
    VISTAType,
    ChannelGroupType,
    _
) {

    function makeEnumerationRange(enumerationList) {
        var enumerations =
                enumerationList.map(function (enumDefinition) {
                    return {
                        string: enumDefinition.enum_string,
                        value: Number(enumDefinition.enum_value)
                    };
                }),
            enumerationRange = {
                key: "enum",
                name: "Enum",
                type: "enum",
                format: "enum",
                source: "dn",
                enumerations: enumerations,
                hints: {
                    range: 0
                }
            };

        return enumerationRange;
    }

    function buildChannelObject(channel, object) {
        object.name = channel.channel_id + ' - ' + channel.channel_name;
        object.telemetry.channel_id = channel.channel_id;
        object.telemetry.definition = channel;

        if (channel.dn_to_eu === 'ON') {
            object.telemetry.defaultEU = true;
            object.telemetry.values.push({
                name: "EU",
                key: "eu",
                type: "eu",
                units: channel.eu_units,
                formatString: channel.eu_io_format,
                hints: {
                    range: 2
                }
            });
            object.telemetry.values.push({
                name: "EU ALARM STATE",
                key: "eu_alarm_state",
                format: "string",
                hints: {
                    range: 3
                }
            });
        }

        object.telemetry.values.push({
            name: "DN",
            key: "dn",
            type: "dn",
            units: channel.dn_units,
            formatString: channel.io_format,
            hints: {
                range: 5
            }
        });

        object.telemetry.values.push({
            name: "DN ALARM STATE",
            key: "dn_alarm_state",
            format: "string",
            hints: {
                range: 6
            }
        });

        object.telemetry.values.push({
            name: "DSS ID",
            key: "dss_id",
            format: "number",
            filters: ['equals']
        });

        if (channel.enumerations && channel.enumerations.length) {
            object.telemetry.values.push(
                makeEnumerationRange(channel.enumerations)
            );
            object.telemetry.values.push({
                key: "status",
                name: "Status",
                type: "string",
                format: "string",
                hints: {
                }
            });
        } else if (channel.data_type === 'BOOLEAN' ||
                   channel.data_type === 'BOOL') {

            object.telemetry.values.push({
                key: "enum",
                name: "Enum",
                type: "enum",
                format: "enum",
                source: "dn",
                enumerations: [
                    {
                        string: "TRUE",
                        value: 1
                    },
                    {
                        string: "FALSE",
                        value: 0
                    }
                ],
                hints: {
                    range: 0
                }
            });
        }

        object.telemetry.values.push({
            key: 'module',
            name: 'Module',
            format: 'string'
        });

        object.telemetry.values.push({
            key: 'realtime',
            name: 'Realtime',
            format: 'string',
            filters: [{
                comparator: 'equals',
                possibleValues: [{value: true, label: "Realtime"}, {value: false, label: "Recorded"}]
            }]
        });
        
        if (channel.status === 'missing') {
            object.status = 'missing';
        }

        object.telemetry.values.push({
            key: 'isStale',
            source: 'isStale',
            name: 'Stale',
            format: 'enum',
            type: 'enum',
            enumerations: [
                {
                    string: "TRUE",
                    value: 1
                },
                {
                    string: "FALSE",
                    value: 0
                }
            ],
            hints: {
                range: 7
            }
        });

        return object;
    }

    /**
     * Represents a Channel in a specific dataset; e.g. A-0001.
     *
     * Id format: "vista:channel:<dataset_id>:<channel_id>"
     */
    var ChannelType = new VISTAType({
        key: "vista.channel",
        name: "Channel",
        cssClass: "icon-telemetry",
        pattern: /^channel:([a-zA-Z0-9\-:]+):([a-zA-Z0-9\-]+)/,
        transform: function (match) {
            return {
                datasetIdentifier: VISTAType.toIdentifier(match[1]),
                channelId: match[2]
            };
        },
        makeId: function (datasetIdentifier, channelId) {
            return "channel:" + VISTAType.toKeyString(datasetIdentifier) + ":" + channelId;
        },
        getLocation: function (dataset, data) {
            return ChannelGroupType.makeIdentifier(
                data.channelId.split('-')[0],
                data.datasetIdentifier
            );
        },
        makeObject: function (dataset, data) {
            var object = {
                type: this.key,
                telemetry: {
                    values: [
                        {
                            key: 'channel_id',
                            name: 'ID',
                            type: 'string',
                            format: 'string',
                            hints: {}
                        }
                    ],
                    mcwsVersion: dataset.version
                },
                location: this.getLocation(dataset, data)
            };

            if (dataset.hasChannels()) {
                _.assignIn(object.telemetry, dataset.channels.urls);
                return dataset.channels.getChannel(data.channelId)
                    .then(function (channel) {
                        return buildChannelObject(channel, object);
                    }.bind(this));
            }
            object.name = data.channelId + ' - MISSING CHANNEL';
            object.status = 'missing';
            return Promise.resolve(object);
        }
    });

    return ChannelType;

});
