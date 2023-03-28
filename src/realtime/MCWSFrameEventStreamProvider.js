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
    var MCWSFrameEventStreamProvider = MCWSStreamProvider.extend({
        constructor: function (openmct, vistaTime) {
            MCWSStreamProvider.call(this, openmct, vistaTime);
        }
    });

    MCWSFrameEventStreamProvider.prototype.getUrl = function (domainObject) {
        return domainObject.telemetry && domainObject.telemetry.frameEventStreamUrl;
    };

    MCWSFrameEventStreamProvider.prototype.getKey = function (domainObject) {
        if (domainObject.type === 'vista.frame-event-filter') {
            var frameEventType = domainObject.identifier.key.split(':')[0];
            return frameEventType;
        } else {
            return undefined;
        }
    };

    MCWSFrameEventStreamProvider.prototype.getProperty = function (domainObject) {
        if (domainObject.type === 'vista.frame-event-filter') {
            return 'message_type';
        } else {
            return 'some_undefined_property';
        }
    };

    MCWSFrameEventStreamProvider.prototype.notifyWorker = function (key, value) {
        MCWSStreamProvider.prototype.notifyWorker.call(this, key, value);
    };

    return MCWSFrameEventStreamProvider;
});
