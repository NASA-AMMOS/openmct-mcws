import CommandDetailViewProvider from './CommandDetailViewProvider.js';

export default function CommandDetailPlugin() {
  return function install(openmct) {
    openmct.objectViews.addProvider(new CommandDetailViewProvider(openmct));
  };
}
