import ChannelLimitsProvider from './ChannelLimitsProvider';

export default function ChannelLimitsPlugin() {
    return function install(openmct) {
        openmct.telemetry.addProvider(new ChannelLimitsProvider());
    };
}
