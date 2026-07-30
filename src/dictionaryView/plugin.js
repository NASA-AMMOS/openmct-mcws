import DictionaryViewProvider from './dictionaryViewProvider.js';

export default function plugin(options) {
  return function install(openmct) {
    openmct.objectViews.addProvider(new DictionaryViewProvider(openmct, options));
  };
}
