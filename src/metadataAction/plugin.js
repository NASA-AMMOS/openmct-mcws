import MetadataAction from './metadataAction';

export default function plugin () {
    return function install(openmct) {
        openmct.actions.register(new MetadataAction(openmct));
    };
}