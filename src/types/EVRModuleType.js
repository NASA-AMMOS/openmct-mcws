import VISTAType from './VISTAType.js';
import EVRSourceType from './EVRSourceType.js';
import constants from '../constants.js';

/**
 * TODO: Need EVR module for VISTA.
 * Represents a Node, either containing evrs or channels.  Nodes may
 * also contain subgroups of evrs or channels.
 *
 * Id format: "vista:node:<node_type>:<group_id>:<dataset_id>"
 *
 * group ids come in two formats: top level groups and subgroups.
 * top level group format: <group_key>
 * sub group format: <group_key>/<group_index>
 */
const EVRModuleType = new VISTAType({
  key: 'vista.evrModule',
  name: 'EVR Module',
  cssClass: 'icon-dictionary',
  pattern: /^node:evr:([a-zA-Z0-9/_-]+):([a-zA-Z0-9-:]+)/,
  transform: function (match) {
    return {
      name: match[1],
      datasetIdentifier: VISTAType.toIdentifier(match[2])
    };
  },
  getLocation: function (dataset, data) {
    return EVRSourceType.makeIdentifier(data.datasetIdentifier);
  },
  makeId: function (name, datasetIdentifier) {
    return ['node', 'evr', name, VISTAType.toKeyString(datasetIdentifier)].join(':');
  },
  hasComposition: function (domainObject) {
    return !!domainObject.telemetry.module;
  },
  getComposition: function (domainObject, dataset, data, types) {
    if (dataset.hasEVRs()) {
      return dataset.evrs.getModuleEVRs(data.name).then((evrs) => {
        return evrs.map((evr_name) => {
          return types.EVR.makeIdentifier(data.datasetIdentifier, evr_name);
        });
      });
    }
    return Promise.resolve([]);
  },
  makeModule: function (dataset, data) {
    return {
      name: data.name.toUpperCase(),
      type: this.key,
      telemetry: {
        values: constants.EVR_RANGES.slice(),
        module: data.name.toUpperCase(),
        mcwsVersion: dataset.version
      },
      location: this.getLocation(dataset, data)
    };
  },
  makeLevel: function (dataset, data) {
    return {
      name: 'Level: ' + data.name.toUpperCase(),
      type: this.key,
      telemetry: {
        values: constants.EVR_RANGES.slice(),
        level: data.name,
        mcwsVersion: dataset.version
      },
      location: this.getLocation(dataset, data)
    };
  },
  makeObject: function (dataset, data) {
    return dataset.evrs.load().then(() => {
      let object;
      if (dataset.evrs.levels.indexOf(data.name) !== -1) {
        object = this.makeLevel(dataset, data);
      } else {
        object = this.makeModule(dataset, data);
      }
      Object.assign(object.telemetry, dataset.evrs.urls);
      return object;
    });
  }
});

export default EVRModuleType;
