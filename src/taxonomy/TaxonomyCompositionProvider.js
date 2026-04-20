import types from '../types/types.js';

class TaxonomyCompositionProvider {
  constructor(datasetCache) {
    this.datasetCache = datasetCache;
  }

  appliesTo(domainObject) {
    return (
      domainObject.identifier.namespace === 'vista' &&
      types.hasTypeForKey(domainObject.type) &&
      types.typeForKey(domainObject.type).hasComposition(domainObject)
    );
  }

  load(domainObject) {
    const matchingType = types.typeForKey(domainObject.type);
    const data = matchingType.data(domainObject.identifier);
    return this.datasetCache.get(data.datasetIdentifier).then((dataset) => {
      return matchingType.getComposition(domainObject, dataset, data, types);
    });
  }
}

export default TaxonomyCompositionProvider;
