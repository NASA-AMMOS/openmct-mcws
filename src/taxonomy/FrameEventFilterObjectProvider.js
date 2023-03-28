define([
    '../constants',
    '../types/types'
], function (constants, types) {

    function FrameEventFilterObjectProvider(cache) {
        this.cache = cache;
    }

    FrameEventFilterObjectProvider.prototype.get = function (identifier) {
        var frameEventTypeDatasetTokens = identifier.key.split(':', 3);
        var frameEventType = frameEventTypeDatasetTokens[0];
        var datasetId = frameEventTypeDatasetTokens[2];
        var datasetIdentifier;

        datasetIdentifier = {
            key: datasetId,
            namespace: frameEventTypeDatasetTokens[1]                
        };

        return this.cache.get(datasetIdentifier)
            .then(function (dataset) {

                return {
                    type: 'vista.frame-event-filter',
                    identifier: identifier,
                    location: 'vista:' + types.FrameEvent.makeId(datasetIdentifier),
                    telemetry: {
                        frameEventStreamUrl: dataset.options.frameEventStreamUrl,
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
                            key: 'message_type',
                            name: 'Message Type'
                        },
                        {
                            key: 'summary',
                            name: 'Summary'
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
                        }]
                    },
                    name: constants.FRAME_EVENT_TYPES[frameEventType]
                };
            });
    };

    return FrameEventFilterObjectProvider;
});
