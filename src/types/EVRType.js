import VISTAType from './VISTAType.js';
import EVRModuleType from './EVRModuleType.js';
import constants from '../constants.js';

/**
 * Represents a EVR Name in a specific dataset; e.g. EVR_THING_HAPPEN.
 *
 * Id format: "vista:evr:<dataset_id>:<evr_name>"
 */
const EVRType = new VISTAType({
  key: 'vista.evr',
  name: 'EVR',
  cssClass: 'icon-object',
  pattern: /^evr:([a-zA-Z0-9-:]+):([a-zA-Z0-9_-]+)/,
  transform: function (match) {
    return {
      datasetIdentifier: VISTAType.toIdentifier(match[1]),
      name: match[2]
    };
  },
  getLocation: function (dataset, data) {
    // FIXME: this works solely because the dataset must have loaded for
    // the EVRType to load.
    return EVRModuleType.makeIdentifier(
      dataset.evrs.byName[data.name].module,
      data.datasetIdentifier
    );
  },
  makeId: function (datasetIdentifier, name) {
    return 'evr:' + VISTAType.toKeyString(datasetIdentifier) + ':' + name;
  },
  makeObject: function (dataset, data) {
    if (dataset.hasEVRs()) {
      return dataset.evrs.load().then(() => {
        const object = {
          name: data.name.toUpperCase(),
          type: this.key,
          telemetry: {
            values: constants.EVR_RANGES.slice(),
            evr_name: data.name.toUpperCase(),
            mcwsVersion: dataset.version,
            definition: dataset.evrs.byName[data.name]
          },
          location: this.getLocation(dataset, data)
        };

        Object.assign(object.telemetry, dataset.evrs.urls);

        return object;
      });
    }

    return Promise.resolve({
      name: data.name.toUpperCase(),
      type: this.key,
      telemetry: {
        values: constants.EVR_RANGES.slice(),
        evr_name: data.name.toUpperCase(),
        mcwsVersion: dataset.version
      }
    });
  }
});

export default EVRType;
