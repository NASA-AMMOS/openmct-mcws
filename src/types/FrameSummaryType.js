define([
    './VISTAType'
], function (
    VISTAType
) {
    
    var FrameSummaryType = new VISTAType({
        key: "vista.frameSummary",
        name: "Frame Summary Events",
        cssClass: "icon-telemetry",
        pattern: /^frame-summary:([a-zA-Z0-9\-:]+)/,
        transform: function (match) {
            return {
                datasetIdentifier: VISTAType.toIdentifier(match[1])
            };
        },
        makeId: function (datasetIdentifier) {
            return "frame-summary:" + VISTAType.toKeyString(datasetIdentifier);
        },
        makeObject: function (dataset, data) {
            return dataset.load()
                .then(function () {
                    return {
                        name: "Frame Summary Events",
                        type: this.key,
                        location: this.getLocation(dataset, data),
                        telemetry: {
                            frameSummaryStreamUrl: dataset.options.frameSummaryStreamUrl,
                            realtimeOnly: true,
                            mcwsVersion: dataset.version,
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
                                key: 'dead_frames',
                                name: 'Dead Frames'
                            }, {
                                key: 'frame_bytes',
                                name: 'Frame Bytes'
                            }, {
                                key: 'idle_frames',
                                name: 'Idle Frames'
                            }, {
                                key: 'insync',
                                name: 'In Sync',
                                format: 'string'
                            }, {
                                key: 'num_frames',
                                name: 'Num. Frames'
                            }, {
                                key: 'out_of_sync_bytes',
                                name: 'Out of Sync. Bytes'
                            }, {
                                key: 'bad_frame_count',
                                name: 'Bad Frame Count'
                            }, {
                                key: 'out_of_sync_count',
                                name: 'Out of Sync. Count'
                            }, {
                                key: 'bitrate',
                                name: 'Bitrate'
                            }, {
                                key: 'frame_summaries',
                                name: 'Frame Summaries',
                                format: 'jsonString'
                            }, {
                                key: 'encoding_summaries',
                                name: 'Encoding Summaries',
                                format: 'jsonString'
                            }]
                        }
                    };
                }.bind(this));
        }
    });

    return FrameSummaryType;
});
