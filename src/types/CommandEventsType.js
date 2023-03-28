define([
    './VISTAType'
], function (
    VISTAType
) {

    const makeStringColumn = function (key, index) {
        return {
            key: key,
            name: _.startCase(key),
            format: 'string',
            hints: {
                range: index
            }
        };
    };

    const COMMAND_TYPES = [
        {
            value: 'UNKNOWN',
            label: 'UNKNOWN'
        },
        {
            value: 'FlightSoftwareCommand',
            label: 'Flight Software Command'
        },
        {
            value: 'HardwareCommand',
            label: 'Hardware Command'
        },
        {
            value: 'SseCommand',
            label: 'Sse Command'
        },
        {
            value: 'FileLoad',
            label: 'File Load'
        },
        {
            value: 'Scmf',
            label: 'Scmf'
        },
        {
            value: 'RawUplinkData',
            label: 'Raw Uplink Data'
        },
        {
            value: 'SequenceDirective',
            label: 'Sequence Directive'
        }
    ];

    const STATUS_TYPES = [
        {
            value: 'UNKNOWN',
            label: 'UNKNOWN'
        },
        {
            value: 'Requested',
            label: 'Requested'
        },
        {
            value: 'Scheduled',
            label: 'Scheduled'
        },
        {
            value: 'Radiating',
            label: 'Radiating'
        },
        {
            value: 'Radiated',
            label: 'Radiated'
        },
        {
            value: 'Radiation_Error',
            label: 'Radiation Error'
        },
        {
            value: 'Radiation_Failed',
            label: 'Radiation Failed'
        },
        {
            value: 'Deleted',
            label: 'Deleted'
        },
        {
            value: 'Expired_Window',
            label: 'Expired Window'
        },
        {
            value: 'Windows_Expired',
            label: 'Windows Expired'
        },
        {
            value: 'Rad_Attempts_Exceeded',
            label: 'Rad Attempts Exceeded'
        },
        {
            value: 'Received',
            label: 'Received'
        },
        {
            value: 'Corrupted',
            label: 'Corrupted'
        },
        {
            value: 'Aborted',
            label: 'Aborted'
        },
        {
            value: 'Not_Radiated',
            label: 'Not Radiated'
        },
        {
            value: 'Awaiting_Confirmation',
            label: 'Awaiting Confirmation'
        }
    ];

    /**
     * Represents a CommandEvents node.
     *
     * Id format: "vista:commandEvents:<dataset_id>"
     */
    var CommandEventsType = new VISTAType({
        key: "vista.commandEvents",
        name: "Command Events",
        cssClass: "icon-telemetry",
        pattern: /^commandEvents:([a-zA-Z0-9\-:]+)/,
        transform: function (match) {
            return {
                datasetIdentifier: VISTAType.toIdentifier(match[1])
            };
        },
        makeId: function (datasetIdentifier) {
            return "commandEvents:" + VISTAType.toKeyString(datasetIdentifier);
        },
        makeObject: function (dataset, data) {
            return dataset.load()
                .then(function () {
                    return {
                        name: "Command Events",
                        type: this.key,
                        location: this.getLocation(dataset, data),
                        telemetry: {
                            commandEventUrl: dataset.options.commandEventUrl,
                            commandEventStreamUrl: dataset.options.commandEventStreamUrl,
                            mcwsVersion: dataset.version,
                            ignoreDomains: false,
                            values: [
                                {
                                    key: 'event_time',
                                    source: 'event_time',
                                    name: 'Event Time',
                                    format: 'utc.day-of-year',
                                    hints: {
                                        domain: 1
                                    }
                                },
                                makeStringColumn('session_id', 2),
                                makeStringColumn('session_host', 3),
                                makeStringColumn('request_id', 4),
                                {
                                    key: 'command_type',
                                    name: 'Command Type',
                                    format: 'string',
                                    hints: {
                                        domain: 5
                                    },
                                    filters: [
                                        {
                                            comparator: 'equals',
                                            possibleValues: COMMAND_TYPES
                                        }
                                    ]
                                },
                                {
                                    key: 'status',
                                    name: 'Status',
                                    format: 'string',
                                    hints: {
                                        domain: 6
                                    },
                                    filters: [
                                        {
                                            comparator: 'equals',
                                            possibleValues: STATUS_TYPES
                                        }
                                    ]
                                },
                                // makeStringColumn('status', 6),
                                makeStringColumn('command_string', 7),
                                makeStringColumn('scmf_file', 8),
                                makeStringColumn('original_file', 9),
                                makeStringColumn('fail_reason', 10),
                                makeStringColumn('checksum', 11),
                                makeStringColumn('total_cltus', 12),
                                makeStringColumn('dss_id', 13),
                                makeStringColumn('bit1_rad_time', 14),
                                makeStringColumn('last_bit_rad_time', 15),
                                makeStringColumn('final', 16),
                                makeStringColumn('finalized', 17),
                                makeStringColumn('vcid', 18),
                                makeStringColumn('commanded_side', 19)
                            ]
                        }
                    };
                }.bind(this));
        }
    });

    return CommandEventsType;

});
