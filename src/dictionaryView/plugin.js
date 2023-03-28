import DictionaryViewProvider from './dictionaryViewProvider';

export default function plugin() {
    return function install(openmct) {
        openmct.objectViews.addProvider(new DictionaryViewProvider(openmct));
    }
}
