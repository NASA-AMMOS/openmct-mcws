/*global define*/

define([
    './MCWSStreamProvider',
    'lodash'
], function (
    MCWSStreamProvider,
    _
) {
    'use strict';

    /**
     * Provides real-time streaming EVR data.
     * @constructor
     * @augments {MCWSStreamProvider}
     * @memberof {vista/telemetry}
     */
    var MCWSEVRStreamProvider = MCWSStreamProvider.extend({});

    MCWSEVRStreamProvider.prototype.getUrl = function (domainObject) {
        if (domainObject.telemetry && !domainObject.telemetry.level) {
            return domainObject.telemetry.evrStreamUrl;
        }
    };

    MCWSEVRStreamProvider.prototype.getProperty = function (domainObject) {
        return 'module';
    };

    MCWSEVRStreamProvider.prototype.getKey = function (domainObject) {
        // Can subscribe only by EVR module even if subscribing by EVR
        let module = domainObject.telemetry
            && domainObject.telemetry.definition
            && domainObject.telemetry.definition.module
            && domainObject.telemetry.definition.module.toLowerCase();

        // legacy inference of module by evr_name
        // if this fallback is used will break on module names containing underscores
        if (!module || module.length <= 0) {
            console.warn('Legacy domain objects should not be used anymore!');
            module = domainObject.telemetry.evr_name ?
                domainObject.telemetry.evr_name.split("_")[0].toLowerCase() :
                domainObject.telemetry.module.toLowerCase();
        }

        return module;
    };

    MCWSEVRStreamProvider.prototype.subscribe = function (domainObject, callback, options) {
        // EVR Source subscription
        if (domainObject.telemetry.modules) {
            return this.multiSubscribe(domainObject, callback, options);
        }

        if (domainObject.telemetry.evr_name) {
            var wrappedCallback = function (value) {
                if (value.name === domainObject.telemetry.evr_name) {
                    callback(value);
                };
            }
            return MCWSStreamProvider.prototype.subscribe
                .call(this, domainObject, wrappedCallback, options);
        }
        return MCWSStreamProvider.prototype.subscribe
                .call(this, domainObject, callback, options);
    };

    MCWSEVRStreamProvider.prototype.multiSubscribe = function (domainObject, callback, options) {
        var unsubscribes = domainObject.telemetry.modules.map(function (module) {
            var moduleObject = {
                telemetry: {
                    evrStreamUrl: domainObject.telemetry.evrStreamUrl,
                    module: module
                }
            };

            return MCWSStreamProvider.prototype
                .subscribe.call(this, moduleObject, callback, options);
            }, this);

        return function () {
            unsubscribes.forEach(function (unsubscribe) {
                unsubscribe();
            });
        };
    };

    return MCWSEVRStreamProvider;
});
