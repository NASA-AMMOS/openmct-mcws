import PacketQueryViewProvider from './PacketQueryViewProvider';

export default function PacketSummaryPlugin() {
    return function install(openmct) {
        openmct.objectViews.addProvider(new PacketQueryViewProvider(openmct));
    };
}
