import types from '../types/types.js';

class TaxonomyObjectProvider {
  constructor(datasetCache, domains) {
    this.datasetCache = datasetCache;
    this.domains = domains;
  }

  get(identifier) {
    const matchingType = types.typeForIdentifier(identifier);

    const data = matchingType.data(identifier);
    return this.datasetCache
      .get(data.datasetIdentifier)
      .then((dataset) => {
        return dataset.load();
      })
      .then((dataset) => {
        return matchingType.makeObject(dataset, data).then((object) => {
          object.identifier = identifier;
          // FIXME: openmct should take identifier as location.
          if (object.location) {
            const parentIdentifier = object.location;
            object.location = parentIdentifier.key;
            if (parentIdentifier.namespace) {
              object.location = parentIdentifier.namespace + ':' + object.location;
            }
          }
          if (dataset.options.prefix) {
            object.name = dataset.options.prefix + ' ' + object.name;
          }

          if (object.telemetry && object.telemetry.values && !object.telemetry.ignoreDomains) {
            object.telemetry.values = this.domains.concat(object.telemetry.values);
          }

          return object;
        });
      });
  }
}

export default TaxonomyObjectProvider;
