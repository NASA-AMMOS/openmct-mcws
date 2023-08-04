import VirtualChannelGlobalFilterPlugin from './virtualChannelGlobalFilter/plugin';

export default function plugin(config) {
  const {
    virtualChannelGroups
  } = config;

  return function install(openmct) {
    if (virtualChannelGroups) {
      openmct.install(new VirtualChannelGlobalFilterPlugin(virtualChannelGroups));
    }
  };
}
