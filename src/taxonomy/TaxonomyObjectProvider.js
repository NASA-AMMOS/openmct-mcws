define([
    '../types/types'
], function (
    types
) {

    function TaxonomyObjectProvider(datasetCache, domains) {
        this.datasetCache = datasetCache;
        this.domains = domains;
    }

    TaxonomyObjectProvider.prototype.get = function (identifier) {
        var matchingType = types.typeForIdentifier(identifier);

        var data = matchingType.data(identifier);
        return this.datasetCache.get(data.datasetIdentifier)
            .then(function (dataset) {
                return dataset.load();
            })
            .then(function (dataset) {
                return matchingType.makeObject(dataset, data)
                    .then(function (object) {
                        object.identifier = identifier;
                        // FIXME: openmct should take identifier as location.
                        if (object.location) {
                            var parentIdentifier = object.location;
                            object.location = parentIdentifier.key;
                            if (parentIdentifier.namespace) {
                                object.location = parentIdentifier.namespace + ':' +
                                    object.location;
                            }
                        }
                        if (dataset.options.prefix) {
                            object.name = dataset.options.prefix + ' ' + object.name;
                        }

                        if (object.telemetry && object.telemetry.values && !object.telemetry.ignoreDomains) {
                            object.telemetry.values = this.domains.concat(object.telemetry.values);
                        }

                        return object;
                    }.bind(this));
            }.bind(this));
    };

    return TaxonomyObjectProvider;
});
