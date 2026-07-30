import MetadataAction from './metadataAction.js';

export default function plugin() {
  return function install(openmct) {
    openmct.actions.register(new MetadataAction(openmct));
  };
}
