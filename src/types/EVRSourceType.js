import VISTAType from './VISTAType.js';
import constants from '../constants.js';

/**
 * Represents an EVR Source in a dataset, a node that contains all
 * EVRs in a specific dataset.
 *
 * Id format: "vista:source:evr:<dataset_id>"
 */
const EVRSourceType = new VISTAType({
  key: 'vista.evrSource',
  name: 'EVRs',
  cssClass: 'icon-dictionary',
  pattern: /^source:evr:([a-zA-Z0-9-:]+)/,
  transform: function (match) {
    return {
      datasetIdentifier: VISTAType.toIdentifier(match[1])
    };
  },
  makeId: function (datasetIdentifier) {
    return 'source:evr:' + VISTAType.toKeyString(datasetIdentifier);
  },
  getComposition: function (domainObject, dataset, data, types) {
    if (dataset.hasEVRs()) {
      return Promise.all([dataset.evrs.getModules(), dataset.evrs.getLevels()]).then(
        (results) => {
          return results[1].concat(results[0]).map((module) => {
            return types.EVRModule.makeIdentifier(module, data.datasetIdentifier);
          });
        }
      );
    }
    return Promise.resolve([]);
  },
  makeObject: function (dataset, data) {
    if (dataset.hasEVRs()) {
      return dataset.evrs.getModules().then((modules) => {
        const object = {
          type: this.key,
          location: this.getLocation(dataset, data),
          name: 'EVRs',
          telemetry: {
            values: constants.EVR_RANGES.slice(),
            mcwsVersion: dataset.version,
            modules: modules
          }
        };

        constants.EVR_PROPERTIES
          .filter((key) => dataset.options.hasOwnProperty(key))
          .forEach((key) => {
            object.telemetry[key] = dataset.options[key];
          });

        return object;
      });
    }
    return Promise.resolve({
      type: this.key,
      location: this.getLocation(dataset, data),
      name: 'EVRs',
      telemetry: {
        values: constants.EVR_RANGES.slice(),
        mcwsVersion: dataset.version
      }
    });
  }
});

export default EVRSourceType;
