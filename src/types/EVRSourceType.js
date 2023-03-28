define([
    './VISTAType',
    '../constants',
    'lodash'
], function (
    VISTAType,
    constants,
    _
) {


    /**
     * Represents an EVR Source in a dataset, a node that contains all
     * EVRs in a specific dataset.
     *
     * Id format: "vista:source:evr:<dataset_id>"
     */
    var EVRSourceType = new VISTAType({
        key: "vista.evrSource",
        name: "EVRs",
        cssClass: "icon-dictionary",
        pattern: /^source:evr:([a-zA-Z0-9\-:]+)/,
        transform: function(match) {
            return {
                datasetIdentifier: VISTAType.toIdentifier(match[1])
            };
        },
        makeId: function (datasetIdentifier) {
            return "source:evr:" + VISTAType.toKeyString(datasetIdentifier);
        },
        getComposition: function (domainObject, dataset, data, types) {
            if (dataset.hasEVRs()) {
                return Promise.all([
                    dataset.evrs.getModules(),
                    dataset.evrs.getLevels()
                ]).then(function (results) {
                    return results[1]
                        .concat(results[0])
                        .map(function (module) {
                            return types.EVRModule.makeIdentifier(
                                module,
                                data.datasetIdentifier
                            );
                        });
                });
            }
            return Promise.resolve([]);
        },
        makeObject: function (dataset, data) {
            if (dataset.hasEVRs()) {
                return dataset.evrs.getModules()
                    .then(function (modules) {
                        var object = {
                            type: this.key,
                            location: this.getLocation(dataset, data),
                            name: 'EVRs',
                            telemetry: {
                                values: constants.EVR_RANGES.slice(),
                                mcwsVersion: dataset.version,
                                modules: modules
                            }
                        };

                        _.assignIn(
                            object.telemetry,
                            _.pick(dataset.options, constants.EVR_PROPERTIES)
                        );

                        return object;
                    }.bind(this));
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

    return EVRSourceType;

});
