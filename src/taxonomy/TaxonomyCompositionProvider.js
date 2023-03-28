define([
    '../types/types'
], function (
    types
) {
    function TaxonomyCompositionProvider(datasetCache) {
        this.datasetCache = datasetCache;
    }

    TaxonomyCompositionProvider.prototype.appliesTo = function (domainObject) {
        return domainObject.identifier.namespace === 'vista' &&
            types.hasTypeForKey(domainObject.type) &&
            types.typeForKey(domainObject.type).hasComposition(domainObject);
    };

    TaxonomyCompositionProvider.prototype.load = function (domainObject) {
        var matchingType = types.typeForKey(domainObject.type);
        var data = matchingType.data(domainObject.identifier);
        return this.datasetCache.get(data.datasetIdentifier)
            .then(function (dataset) {
                return matchingType.getComposition(domainObject, dataset, data, types);
            });


    };

    return TaxonomyCompositionProvider;
});
