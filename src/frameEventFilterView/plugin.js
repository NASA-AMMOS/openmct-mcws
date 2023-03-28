import FrameEventFilterViewProvider from './FrameEventFilterViewProvider.js';

export default function FrameEventFilterViewPlugin() {
    return function install(openmct) {
        openmct.objectViews.addProvider(new FrameEventFilterViewProvider(openmct));
    };
}
