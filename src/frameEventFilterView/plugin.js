import FrameEventFilterViewProvider from './FrameEventFilterViewProvider.js';

export default function FrameEventFilterViewPlugin(options) {
    return function install(openmct) {
        openmct.objectViews.addProvider(new FrameEventFilterViewProvider(openmct, options));
    };
}
