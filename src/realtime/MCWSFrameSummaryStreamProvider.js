/*global define*/

define([
    './MCWSStreamProvider'
], function (
    MCWSStreamProvider
) {
    'use strict';

    /**
     * Provides real-time streaming DataProduct data.
     * @constructor
     * @augments {MCWSStreamProvider}
     * @memberof {vista/telemetry}
     */
    var MCWSFrameSummaryStreamProvider = MCWSStreamProvider.extend({
        constructor: function (openmct, vistaTime) {
            MCWSStreamProvider.call(this, openmct, vistaTime);
        }
    });

    MCWSFrameSummaryStreamProvider.prototype.getUrl = function (domainObject) {
        return domainObject.telemetry && domainObject.telemetry.frameSummaryStreamUrl;
    };

    MCWSFrameSummaryStreamProvider.prototype.getKey = function (domainObject) {
        // We return undefined so that we can match on undefined properties.
        return undefined;
    };

    MCWSFrameSummaryStreamProvider.prototype.getProperty = function () {
        // We just want something that returns undefined so it matches the
        // key above.  Hacky.
        return 'some_undefined_property';
    };

    MCWSFrameSummaryStreamProvider.prototype.notifyWorker = function (key, value) {
        MCWSStreamProvider.prototype.notifyWorker.call(this, key, value);
    };

    return MCWSFrameSummaryStreamProvider;
});
