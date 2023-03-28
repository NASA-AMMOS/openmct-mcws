import FrameWatchViewProvider from './FrameWatchViewProvider';
import FrameWatchConfigurationViewProvider from './FrameWatchConfigurationViewProvider';
import { ENCODING_WATCH_TYPE, FRAME_WATCH_TYPE } from './config';

export default function FrameWatchViewPlugin() {
    return function install(openmct) {
        openmct.types.addType(ENCODING_WATCH_TYPE, {
            name: "Encoding Watch View",
            description: "Drag and drop a Frame Summary Event node into this view to show summary of frame statistics for each unique observed VC and Encoding Family combination.",
            cssClass: "icon-tabular-lad",
            creatable: true,
            initialize(domainObject) {
                domainObject.composition = [];
                domainObject.configuration = {};
            }
        });

        openmct.types.addType(FRAME_WATCH_TYPE, {
            name: "Frame Watch View",
            description: "Drag and drop a Frame Summary Event node into this view to show summary of frame statistics for each unique observed VC and Encoding Type combination.",
            cssClass: "icon-tabular-lad",
            creatable: true,
            initialize(domainObject) {
                domainObject.composition = [];
                domainObject.configuration = {};
            }
        });

        openmct.objectViews.addProvider(new FrameWatchViewProvider(
            openmct,
            'vista.encodingWatchViewProvider',
            'Encoding Watch View',
            ENCODING_WATCH_TYPE
        ));

        openmct.objectViews.addProvider(new FrameWatchViewProvider(
            openmct,
            'vista.frameWatchViewProvider',
            'Frame Watch View',
            FRAME_WATCH_TYPE
        ));

        openmct.inspectorViews.addProvider(new FrameWatchConfigurationViewProvider(
            'vista.encodingWatchConfigurationViewProvider',
            'Encoding Watch Configuration',
            ENCODING_WATCH_TYPE
        ));

        openmct.inspectorViews.addProvider(new FrameWatchConfigurationViewProvider(
            'vista.frameWatchConfigurationViewProvider',
            'Frame Watch Configuration',
            FRAME_WATCH_TYPE
        ));

        openmct.composition.addPolicy((parent, child) => {
            if (parent.type === FRAME_WATCH_TYPE || parent.type === ENCODING_WATCH_TYPE) {
                return child.type === 'vista.frameSummary';
            }

            if (parent.type === 'table') {
                return child.type !== 'vista.frameSummary'
            }
    
            return true;
        });

        // Suppress table view for frame summary events.
        let wrappedGet = openmct.objectViews.get;
        openmct.objectViews.get = function (domainObject) {
            return wrappedGet.apply(this, arguments).filter(
                viewProvider => !(domainObject.type === 'vista.frameSummary' && viewProvider.key === 'table')
            );
        };
    };
}
