define([

], function () {

    var CONSTANTS = {
        DICTIONARY_PROPERTIES: [
            'channelDictionaryUrl',
            'channelEnumerationDictionaryUrl',
            'eventRecordDictionaryUrl'
        ],
        /**
         * An array of model properties that provide evrs.
         */
        EVR_PROPERTIES: [
            'eventRecordDictionaryUrl',
            'evrHistoricalUrl',
            'evrSimStreamUrl',
            'evrSimStreamDatatableUrl',
            'evrStreamUrl',
            'evrLADUrl'
        ],
        /**
         * An array of model properties that provide channels.
         */
        CHANNEL_PROPERTIES: [
            'channelDictionaryUrl'
        ],


        /**
         * An array of model properties that provide different Types of channel
         * telemetry.
         */
        CHANNEL_TAXONOMY_PROPERTIES: [
            'channelHistoricalUrl',
            'channelMinMaxUrl',
            'channelLADUrl',
            'channelSimStreamUrl',
            'channelSimStreamDatatableUrl',
            'channelStreamUrl'
        ],


        /**
         * An array of model properties that provide data products.
         */
        DATA_PRODUCT_PROPERTIES: [
            'dataProductUrl',
            'dataProductContentUrl'
        ],

        /**
         * An array of model properties that provide packet metadata and contents.
         * @type {string[]}
         */
        PACKET_PROPERTIES: [
            'packetUrl',
            'packetContentUrl'
        ],

        /**
         * Ranges available on an EVR type.
         */
        EVR_RANGES: [
            {
                name: "Record Type",
                key: "record_type",
                format: "string",
                hints: {}
            }, {
                name: "Module",
                key: "module",
                format: "string",
                hints: {}
            }, {
                name: "Level",
                key: "level",
                format: "string",
                hints: {}
            }, {
                name: "EVR Name",
                key: "name",
                format: "string",
                hints: {}
            }, {
                name: "Message",
                key: "message",
                format: "string",
                hints: {}
            }, {
                name: "Metadata Values",
                key: "metadata_values",
                format: "string",
                hints: {}
            }, {
                name: "Metadata keywords",
                key: "metadata_keywords",
                format: "string",
                hints: {}
            }, {
                name: "Event ID",
                key: "event_id",
                format: "string",
                hints: {}
            }, {
                name: "DSS ID",
                key: "dss_id",
                format: "integer",
                hints: {}
            }, {
                name: "Realtime?",
                key: "realtime",
                format: "string",
                hints: {},
                filters: [{
                    comparator: 'equals',
                    possibleValues: [{value: true, label: 'Realtime'}, {value: false, label: 'Recorded'}]
                }]
            }, {
                name: "Session ID",
                key: "session_id",
                format: "integer",
                hints: {}
            }, {
                name: "Session Host",
                key: "session_host",
                format: "string",
                hints: {}
            }, {
                name: "From SSE?",
                key: "from_sse",
                format: "string",
                hints: {},
                filters: [{
                    comparator: 'equals',
                    possibleValues: [{value: true, label: 'SSE'}, {value: false, label: 'FSW'}]
                }]
            }, {
                name: "VCID",
                key: "vcid",
                format: "string",
                hints: {}
            }, {
                name: "LST",
                key: "lst",
                format: "string",
                hints: {}
            }, {
                name: "RCT",
                key: "rct",
                format: "string",
                hints: {}
            }, {
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
                    range: 0
                }
            }
        ],

        FRAME_EVENT_TYPES: {
            'BadTelemetryFrame': 'Bad Telemetry Frame',
            'InSync': 'In Sync.',
            'LossOfSync': 'Loss of Sync.',
            'FrameSequenceAnomaly': 'Frame Sequence Anomaly',
            'OutOfSyncData': 'Out Of Sync. Data'
        },

        //Dataset fields that require websockets for realtime data
        WEBSOCKET_STREAM_URL_KEYS: [
            'channelStreamUrl',
            'dataProductStreamUrl',
            'evrStreamUrl',
            'messageStreamUrl',
            'frameSummaryStreamUrl',
            'alarmMessageStreamUrl',
            'frameEventStreamUrl'
        ]
    };

    /**
     * An array of model properties that is necessary to provide channel
     * telemetry.
     */
    CONSTANTS.CHANNEL_COPY_KEYS = CONSTANTS.CHANNEL_PROPERTIES
        .concat(CONSTANTS.CHANNEL_TAXONOMY_PROPERTIES);

    return CONSTANTS;

});
