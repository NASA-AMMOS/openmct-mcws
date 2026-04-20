import PacketQueryViewProvider from './PacketQueryViewProvider.js';

export default function PacketSummaryPlugin() {
  return function install(openmct) {
    openmct.objectViews.addProvider(new PacketQueryViewProvider(openmct));
  };
}
