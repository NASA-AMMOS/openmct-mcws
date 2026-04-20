import filterService from 'services/filtering/FilterService.js';
import MCWSChannelStreamProvider from './MCWSChannelStreamProvider.js';
import MCWSEVRStreamProvider from './MCWSEVRStreamProvider.js';
import MCWSEVRLevelStreamProvider from './MCWSEVRLevelStreamProvider.js';
import MCWSCommandStreamProvider from './MCWSCommandStreamProvider.js';
import MCWSPacketSummaryEventProvider from './MCWSPacketSummaryEventProvider.js';
import MCWSDataProductStreamProvider from './MCWSDataProductStreamProvider.js';
import MCWSMessageStreamProvider from './MCWSMessageStreamProvider.js';
import MCWSFrameSummaryStreamProvider from './MCWSFrameSummaryStreamProvider.js';
import MCWSFrameEventStreamProvider from './MCWSFrameEventStreamProvider.js';
import MCWSAlarmMessageStreamProvider from './MCWSAlarmMessageStreamProvider.js';

function RealtimeTelemetryPlugin(vistaTime, options) {
  return function install(openmct) {
    filterService(openmct, options.globalFilters);

    openmct.telemetry.addProvider(new MCWSChannelStreamProvider(openmct, vistaTime, options));
    openmct.telemetry.addProvider(new MCWSEVRStreamProvider(openmct, vistaTime, options));
    openmct.telemetry.addProvider(new MCWSEVRLevelStreamProvider(openmct, vistaTime, options));
    openmct.telemetry.addProvider(new MCWSCommandStreamProvider(openmct, vistaTime, options));
    openmct.telemetry.addProvider(new MCWSPacketSummaryEventProvider(openmct, vistaTime, options));
    openmct.telemetry.addProvider(new MCWSDataProductStreamProvider(openmct, vistaTime, options));
    openmct.telemetry.addProvider(new MCWSMessageStreamProvider(openmct, vistaTime, options));
    openmct.telemetry.addProvider(new MCWSFrameSummaryStreamProvider(openmct, vistaTime, options));
    openmct.telemetry.addProvider(new MCWSFrameEventStreamProvider(openmct, vistaTime, options));
    openmct.telemetry.addProvider(new MCWSAlarmMessageStreamProvider(openmct, vistaTime, options));
  };
}

export default RealtimeTelemetryPlugin;
