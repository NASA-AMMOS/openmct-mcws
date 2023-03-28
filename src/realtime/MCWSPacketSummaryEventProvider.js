/*global define*/

define([
    './MCWSStreamProvider'
], function (
    MCWSStreamProvider
) {
    'use strict';

    /**
     * Provides real-time streaming PacketSummaryEvent data.
     * @constructor
     * @augments {MCWSStreamProvider}
     * @memberof {vista/telemetry}
     */
    var MCWSPacketSummaryEventProvider = MCWSStreamProvider.extend({});

    MCWSPacketSummaryEventProvider.prototype.getUrl = function (domainObject) {
        return domainObject.telemetry && domainObject.telemetry.packetSummaryEventStreamUrl;
    };

    MCWSPacketSummaryEventProvider.prototype.getKey = function (domainObject) {
        // We return undefined so that we can match on undefined properties.
        return undefined;
    };

    MCWSPacketSummaryEventProvider.prototype.getProperty = function () {
        // We just want something that returns undefined so it matches the
        // key above.  Hacky.
        return 'some_undefined_property';
    };

    return MCWSPacketSummaryEventProvider;
});
