import DictionaryViewProvider from './dictionaryViewProvider';

export default function plugin(options) {
  return function install(openmct) {
    openmct.objectViews.addProvider(new DictionaryViewProvider(openmct, options));
  };
}
