/*global define*/

define([
    './MCWSStreamProvider'
], function (
    MCWSStreamProvider
) {
    'use strict';

    /**
     * Provides real-time streaming channel data.
     * @constructor
     * @augments {MCWSStreamProvider}
     * @memberof {vista/telemetry}
     */
    var MCWSChannelStreamProvider = MCWSStreamProvider.extend({});

    MCWSChannelStreamProvider.prototype.getUrl = function (domainObject) {
        return domainObject.telemetry && domainObject.telemetry.channelStreamUrl;
    };

    MCWSChannelStreamProvider.prototype.getKey = function (domainObject) {
        return domainObject.telemetry.channel_id;
    };

    MCWSChannelStreamProvider.prototype.getProperty = function () {
        return 'channel_id';
    };

    return MCWSChannelStreamProvider;
});
