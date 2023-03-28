import FrameAccountabilityViewProvider from './frameAccountabilityViewProvider';
import FrameAccountabilityCompositionPolicy from './frameAccountabilityCompositionPolicy';

export default function install(expectedVcidList) {
    return function FrameAccountabilityPlugin(openmct) {

        openmct.types.addType('vista.frameaccountability', {
            key: 'vista.frameaccountability',
            name: 'Frame Accountability View',
            description: 'Drag and Drop a Frame Events Node and/or a Command Events Node to see the data in a tree form',
            cssClass: 'icon-tabular',
            initialize(domainObject) {
                domainObject.composition = [];
            },
            creatable(domainObject) {
                return domainObject.type === 'vista.frameaccountability';
            }
        });

        openmct.objectViews.addProvider({
            key: 'vista.frame-accountability',
            name: 'Frame Accountability',
            cssClass: 'icon-tabular-realtime',
            canView(domainObject) {
                return domainObject.type === 'vista.frameaccountability';
            },
            canEdit(domainObject) {
                return domainObject.type === 'vista.frameaccountability';
            },
            view(domainObject) {
                return new FrameAccountabilityViewProvider(domainObject, openmct, expectedVcidList);
            }
        });

        openmct.composition.addPolicy(FrameAccountabilityCompositionPolicy(openmct));
    };
};
