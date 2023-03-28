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
    var MCWSMessageStreamProvider = MCWSStreamProvider.extend({
        constructor: function (openmct, vistaTime) {
            MCWSStreamProvider.call(this, openmct, vistaTime);
        }
    });

    MCWSMessageStreamProvider.prototype.subscribe = function (domainObject, callback, options) {
        var messageType = domainObject.identifier.key.split(':')[0];
        options.filters = options.filters || {};

        if (messageType === 'CommandMessages') {
            options.filters.message_type =  {'equals': [
                'HardwareCommand',
                'FlightSoftwareCommand',
                'SequenceDirective',
                'SseCommand',
                'FileLoad',
                'SCMF',
                'RawUplinkData',
                'CpdUplinkStatus'
            ]};
        }

        return MCWSStreamProvider.prototype.subscribe.call(this, domainObject, callback, options);
    };

    MCWSMessageStreamProvider.prototype.getUrl = function (domainObject) {
        return domainObject.telemetry && domainObject.telemetry.messageStreamUrl;
    };

    MCWSMessageStreamProvider.prototype.getKey = function (domainObject) {
        //if it is the mock domainObject used in ClearDataOnMessage.js
        if (domainObject.identifier.key === 'message::clear-data-static-object') {
            return domainObject.telemetry.key;
        } else {
            return undefined;
        }
    };

    MCWSMessageStreamProvider.prototype.getProperty = function (domainObject) {
        if (domainObject.identifier.key === 'message::clear-data-static-object') {
            return domainObject.telemetry.property;
        } else {
            return 'some_undefined_property';
        }
    };

    MCWSMessageStreamProvider.prototype.notifyWorker = function (key, value) {
        MCWSStreamProvider.prototype.notifyWorker.call(this, key, value);
    };

    return MCWSMessageStreamProvider;
});
