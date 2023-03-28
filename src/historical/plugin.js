define([
    './HistoricalProvider'
], function (
    HistoricalProvider
) {

    function HistoricalTelemetryPlugin(options) {
        return function install(openmct) {
            openmct.telemetry.addProvider(new HistoricalProvider(openmct));

            /**
             * Provide a dummy historical provider for message filters to avoid errors in views due to bug.
             */
            openmct.telemetry.addProvider({
                supportsRequest: function (domainObject) {
                    return domainObject.identifier.namespace === 'vista-message-filter';
                },
                request: function (domainObject) {
                    return Promise.resolve([]);
                }
            })
        }
    }

    return HistoricalTelemetryPlugin;
});
