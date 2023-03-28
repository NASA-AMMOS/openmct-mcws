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
    var MCWSDataProductStreamProvider = MCWSStreamProvider.extend({
        constructor: function (openmct, vistaTime, options) {
            this.options = options;
            MCWSStreamProvider.call(this, openmct, vistaTime);
        }
    });

    MCWSDataProductStreamProvider.prototype.getUrl = function (domainObject) {
        return domainObject.telemetry && domainObject.telemetry.dataProductStreamUrl;
    };

    MCWSDataProductStreamProvider.prototype.getKey = function (domainObject) {
        // We return undefined so that we can match on undefined properties.
        return undefined;
    };

    MCWSDataProductStreamProvider.prototype.getProperty = function () {
        // We just want something that returns undefined so it matches the
        // key above.  Hacky.
        return 'some_undefined_property';
    };

    MCWSDataProductStreamProvider.prototype.subscribe = function (domainObject, callback, options) {
        function wrappedCallback(datum) {
            let sessionId = datum.session_id;

            if (datum.unique_name !== undefined) {
                let uniqueName = datum.unique_name.replace(/\.dat$/, "");
                let filter = "(session_id=" + sessionId + ",unique_name=" + uniqueName + ")";
                let params = "?filter=" + filter + "&filetype=";
                let base_url = domainObject.telemetry.dataProductContentUrl + params;
                datum.emd_url = base_url + '.emd';
                datum.emd_preview = base_url + '.emd';
                datum.dat_url = base_url + '.dat';
                datum.txt_url = base_url.replace('DataProductContent', 'DataProductView') + '.dat';
            }

            callback(datum);
        }

        return MCWSStreamProvider.prototype.subscribe.call(this, domainObject, wrappedCallback, options);   
    }

    MCWSDataProductStreamProvider.prototype.notifyWorker = function (key, value) {
        if (key === 'subscribe' && this.options.realtimeProductAPIDs
            && value.mcwsVersion === 3.2) {
            value.extraFilterTerms = {
                apid: '(' + this.options.realtimeProductAPIDs.join(',') + ')'
            };
        }
        MCWSStreamProvider.prototype.notifyWorker.call(this, key, value);
    };

    return MCWSDataProductStreamProvider;
});
