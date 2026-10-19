import DictionaryViewProvider from './dictionaryViewProvider.js';
import ViewCommandAction from './ViewCommandAction.js';

export default function plugin(options) {
  return function install(openmct) {
    openmct.objectViews.addProvider(new DictionaryViewProvider(openmct, options));
    openmct.actions.register(new ViewCommandAction(openmct));
  };
}
