
define([
    './VISTAType'
], function (
    VISTAType
) {
    var AlarmMessageStreamType = new VISTAType({
        key: "vista.alarmMessageStream",
        name: "Alarm Message Stream",
        cssClass: "icon-telemetry",
        pattern: /^alarm-message-stream:([a-zA-Z0-9\-:]+)/,
        transform: function (match) {
            return {
                datasetIdentifier: VISTAType.toIdentifier(match[1])
            };
        },
        makeId: function (datasetIdentifier) {
            return "alarm-message-stream:" + VISTAType.toKeyString(datasetIdentifier);
        },
        makeObject: function (dataset, data) {
            return dataset.load()
                .then(function () {
                    return {
                        name: "Alarm Message Stream",
                        type: this.key,
                        location: this.getLocation(dataset, data),
                        telemetry: {
                            alarmMessageStreamUrl: dataset.options.alarmMessageStreamUrl,
                            realtimeOnly: true,
                            mcwsVersion: dataset.version,
                            ignoreDomains: true,
                            values: [{
                                key: 'channel_id',
                                name: 'Channel ID',
                                format: 'string',
                                hints: {
                                    priority: 1
                                }
                            },{
                                key: 'title',
                                name: 'Title',
                                format: 'string',
                                hints: {
                                    priority: 2
                                }
                            },{
                                key: 'module',
                                name: 'Module',
                                format: 'string',
                                hints: {
                                    priority: 3
                                },
                                filters: ['equals']
                            },{
                                key: 'name',
                                name: 'FSW Name',
                                format: 'string',
                                hints: {
                                    priority: 4
                                }
                            },{
                                key: 'dn',
                                name: 'Raw',
                                format: 'string',
                                hints: {
                                    priority: 5
                                }
                            },{
                                key: 'dn_units',
                                name: 'Raw Unit',
                                format: 'string',
                                hints: {
                                    priority: 6
                                }
                            },{
                                key: 'eu',
                                name: 'Value',
                                format: 'string',
                                hints: {
                                    priority: 7
                                }
                            },{
                                key: 'eu_units',
                                name: 'Unit',
                                format: 'string',
                                hints: {
                                    priority: 8
                                }
                            },{
                                key: 'ert',
                                name: 'ERT',
                                format: 'utc.day-of-year',
                                hints: {
                                    domain: 1,
                                    priority: 9
                                }
                            },{
                                key: 'sclk',
                                name: 'SCLK',
                                format: 'sclk.float64',
                                hints: {
                                    priority: 10,
                                    domain: 3
                                }
                            },{
                                key: 'scet',
                                name: 'SCET',
                                format: 'utc.day-of-year',
                                hints: {
                                    priority: 11,
                                    domain: 2
                                }
                            },{
                                key: 'in_alarm_ert',
                                name: 'In Alarm ERT',
                                format: 'utc.day-of-year',
                                hints: {
                                    priority: 12
                                }
                            },{
                                key: 'out_alarm_ert',
                                name: 'Out Alarm ERT',
                                format: 'utc.day-of-year',
                                hints: {
                                    priority: 13
                                }
                            },{
                                key: 'alarm_state',
                                name: 'Alarm State',
                                format: 'string',
                                hints: {
                                    priority: 14
                                }
                            },{
                                key: 'lst',
                                name: 'LST',
                                format: 'string',
                                hints: {
                                    priority: 15
                                }
                            },{
                                key: 'dss_id',
                                name: 'DSS ID',
                                format: 'number',
                                hints: {
                                    priority: 16
                                },
                                filters: ['equals']
                            },{
                                key: 'realtime',
                                name: 'Realtime',
                                format: 'string',
                                hints: {
                                    priority: 17
                                },
                                filters: [
                                    {
                                        comparator: 'equals',
                                        possibleValues: [
                                            {value: 'TRUE', label: 'Realtime'},
                                            {value: 'FALSE', label: 'Recorded'}
                                        ]
                                    }
                                ]
                            },{
                                key: 'session_id',
                                name: 'Session ID',
                                format: 'number'
                            },{
                                key: 'session_host',
                                name: 'Session Host',
                                format: 'string'
                            },{
                                key: 'vcid',
                                name: 'VC ID',
                                format: 'number'
                            },{
                                key: 'status',
                                name: 'Status',
                                format: 'string'
                            },{
                                key: 'dn_alarm_state',
                                name: 'DN Alarm State',
                                format: 'string',
                                filters: [
                                    {
                                        comparator: 'equals',
                                        possibleValues: [
                                            {value: 'YELLOW', label: 'Yellow'},
                                            {value: 'RED', label: 'Red'}
                                        ]
                                    }
                                ]
                            },{
                                key: 'previous_dn_alarm_state',
                                name: 'Previous DN Alarm State',
                                format: 'string'
                            },{
                                key: 'eu_alarm_state',
                                name: 'EU Alarm State',
                                format: 'string',
                                filters: [
                                    {
                                        comparator: 'equals',
                                        possibleValues: [
                                            {value: 'YELLOW', label: 'Yellow'},
                                            {value: 'RED', label: 'Red'}
                                        ]
                                    }
                                ]
                            },{
                                key: 'previous_eu_alarm_state',
                                name: 'Previous EU Alarm State',
                                format: 'string'
                            },{
                                key: 'type',
                                name: 'Type',
                                format: 'string'
                            },{
                                key: 'category',
                                name: 'Category',
                                format: 'string',
                                filters: ['equals']
                            },{
                                key: 'subsystem',
                                name: 'Subsystem',
                                format: 'string',
                                filters: ['equals']
                            }]
                        }
                    };
                }.bind(this));
        }
    });

    return AlarmMessageStreamType;
});
