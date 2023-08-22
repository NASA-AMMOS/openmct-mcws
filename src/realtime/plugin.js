define([
    'services/filtering/FilterService',
    './MCWSChannelStreamProvider',
    './MCWSEVRStreamProvider',
    './MCWSEVRLevelStreamProvider',
    './MCWSCommandStreamProvider',
    './MCWSPacketSummaryEventProvider',
    './MCWSDataProductStreamProvider',
    './MCWSMessageStreamProvider',
    './MCWSFrameSummaryStreamProvider',
    './MCWSFrameEventStreamProvider',
    './MCWSAlarmMessageStreamProvider',
], function (
    filterServiceDefault,
    MCWSChannelStreamProvider,
    MCWSEVRStreamProvider,
    MCWSEVRLevelStreamProvider,
    MCWSCommandStreamProvider,
    MCWSPacketSummaryEventProvider,
    MCWSDataProductStreamProvider,
    MCWSMessageStreamProvider,
    MCWSFrameSummaryStreamProvider,
    MCWSFrameEventStreamProvider,
    MCWSAlarmMessageStreamProvider
) {

    function RealtimeTelemetryPlugin(vistaTime, options) {
        return function install(openmct) {
            filterServiceDefault.default(openmct, options.globalFilters);

            openmct.telemetry.addProvider(new MCWSChannelStreamProvider(openmct, vistaTime));
            openmct.telemetry.addProvider(new MCWSEVRStreamProvider(openmct, vistaTime));
            openmct.telemetry.addProvider(new MCWSEVRLevelStreamProvider(openmct, vistaTime));
            openmct.telemetry.addProvider(new MCWSCommandStreamProvider(openmct, vistaTime));
            openmct.telemetry.addProvider(new MCWSPacketSummaryEventProvider(openmct, vistaTime));
            openmct.telemetry.addProvider(new MCWSDataProductStreamProvider(openmct, vistaTime, options));
            openmct.telemetry.addProvider(new MCWSMessageStreamProvider(openmct, vistaTime));
            openmct.telemetry.addProvider(new MCWSFrameSummaryStreamProvider(openmct, vistaTime));
            openmct.telemetry.addProvider(new MCWSFrameEventStreamProvider(openmct, vistaTime));
            openmct.telemetry.addProvider(new MCWSAlarmMessageStreamProvider(openmct, vistaTime));
        }
    }

    return RealtimeTelemetryPlugin;

});
