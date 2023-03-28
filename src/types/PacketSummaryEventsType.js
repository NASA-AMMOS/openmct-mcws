define([
    './VISTAType'
], function (
    VISTAType
) {
    /**
     * Represents a PacketSummaryEvents node.
     *
     * Id format: "vista:packetSummaryEvents:<dataset_id>"
     */
    var PacketSummaryEventsType = new VISTAType({
        key: "vista.packetSummaryEvents",
        name: "Packet Summary Events",
        cssClass: "icon-telemetry",
        pattern: /^packetSummaryEvents:([a-zA-Z0-9\-:]+)/,
        transform: function (match) {
            return {
                datasetIdentifier: VISTAType.toIdentifier(match[1])
            };
        },
        makeId: function (datasetIdentifier) {
            return "packetSummaryEvents:" + VISTAType.toKeyString(datasetIdentifier);
        },
        makeObject: function (dataset, data) {
            return dataset.load()
                .then(function () {
                    return {
                        name: "Packet Summary Events",
                        type: this.key,
                        location: this.getLocation(dataset, data),
                        telemetry: {
                            packetSummaryEventStreamUrl: dataset.options.packetSummaryEventStreamUrl,
                            realtimeOnly: true,
                            mcwsVersion: dataset.version,
                            ignoreDomains: true,
                            values: [
                                {
                                    name: 'VC/AP ID',
                                    key: 'id',
                                    format: 'string'
                                },
                                {
                                    name: 'Count',
                                    key: 'instance_count',
                                    format: 'number'
                                },
                                {
                                    name: 'Name',
                                    key: 'apid_name',
                                    format: 'string'
                                },
                                {
                                    name: 'Last Sequence ID',
                                    key: 'spsc',
                                    format: 'number'
                                },
                                {
                                    name: 'Last ERT',
                                    key: 'ert',
                                    source: 'last_ert_time',
                                    format: 'string',
                                    hints: {
                                        domain: 1
                                    }
                                },
                                {
                                    name: 'Last SCLK',
                                    key: 'sclk',
                                    source: 'last_sclk_time',
                                    format: 'string',
                                    hints: {
                                        domain: 3
                                    }
                                },
                                {
                                    name: 'Last SCET',
                                    key: 'scet',
                                    source: 'last_scet_time',
                                    format: 'string',
                                    hints: {
                                        domain: 2
                                    }
                                },
                                {
                                    name: 'Last LST',
                                    key: 'lmst',
                                    source: 'last_lst_time',
                                    format: 'string',
                                    hints: {
                                        domain: 4
                                    }
                                }
                            ]
                        }
                    };
                }.bind(this));
        }
    });

    return PacketSummaryEventsType;
});
