/*global define*/

define([
    './MCWSStreamProvider'
], function (
    MCWSStreamProvider
) {
    'use strict';

    /**
     * Provides real-time streaming CommandEvent data.
     * @constructor
     * @augments {MCWSStreamProvider}
     * @memberof {vista/telemetry}
     */
    var MCWSCommandStreamProvider = MCWSStreamProvider.extend({});

    MCWSCommandStreamProvider.prototype.getUrl = function (domainObject) {
        return domainObject.telemetry && domainObject.telemetry.commandEventStreamUrl;
    };

    MCWSCommandStreamProvider.prototype.getKey = function (domainObject) {
        // We return undefined so that we can match on undefined properties.
        return undefined;
    };

    MCWSCommandStreamProvider.prototype.getProperty = function () {
        // We just want something that returns undefined so it matches the
        // key above.  Hacky.
        return 'some_undefined_property';
    };

    return MCWSCommandStreamProvider;
});
