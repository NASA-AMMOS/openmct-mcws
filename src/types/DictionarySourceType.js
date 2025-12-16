import VISTAType from './VISTAType.js';
import constants from '../constants.js';

/**
 * Represents a Dictionary Source in a dataset, a node that contains all
 * Dictionaries in a specific dataset.
 *
 * Id format: "vista:source:dictionary:<dataset_id>"
 */
const DictionarySourceType = new VISTAType({
  key: 'vista.dictionarySource',
  name: 'Dictionaries',
  cssClass: 'icon-dictionary',
  pattern: /^source:dictionary:([a-zA-Z0-9-:]+)/,
  transform: function (match) {
    return {
      datasetIdentifier: VISTAType.toIdentifier(match[1])
    };
  },
  makeId: function (datasetIdentifier) {
    return 'source:dictionary:' + VISTAType.toKeyString(datasetIdentifier);
  },
  getComposition: function (domainObject, dataset, data, types) {
    const composition = constants.DICTIONARY_PROPERTIES
      .filter((key) => dataset.options.hasOwnProperty(key))
      .map((key) => types.Dictionary.makeIdentifier(data.datasetIdentifier, key));

    return Promise.resolve(composition);
  }
});

export default DictionarySourceType;
