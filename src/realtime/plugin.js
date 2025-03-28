import filterService from 'services/filtering/FilterService';
import MCWSChannelStreamProvider from './MCWSChannelStreamProvider';
import MCWSEVRStreamProvider from './MCWSEVRStreamProvider';
import MCWSEVRLevelStreamProvider from './MCWSEVRLevelStreamProvider';
import MCWSCommandStreamProvider from './MCWSCommandStreamProvider';
import MCWSPacketSummaryEventProvider from './MCWSPacketSummaryEventProvider';
import MCWSDataProductStreamProvider from './MCWSDataProductStreamProvider';
import MCWSMessageStreamProvider from './MCWSMessageStreamProvider';
import MCWSFrameSummaryStreamProvider from './MCWSFrameSummaryStreamProvider';
import MCWSFrameEventStreamProvider from './MCWSFrameEventStreamProvider';
import MCWSAlarmMessageStreamProvider from './MCWSAlarmMessageStreamProvider';

function RealtimeTelemetryPlugin(vistaTime, options) {
    return function install(openmct) {
        filterService(openmct, options.globalFilters);

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

export default RealtimeTelemetryPlugin;
