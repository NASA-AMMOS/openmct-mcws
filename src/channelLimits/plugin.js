import ChannelLimitsProvider from './ChannelLimitsProvider.js';

export default function ChannelLimitsPlugin() {
  return function install(openmct) {
    openmct.telemetry.addProvider(new ChannelLimitsProvider());
  };
}
