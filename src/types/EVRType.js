define([
    './VISTAType',
    './EVRModuleType',
    '../constants',
    'lodash'
], function (
    VISTAType,
    EVRModuleType,
    constants,
    _
) {

    /**
     * Represents a EVR Name in a specific dataset; e.g. EVR_THING_HAPPEN.
     *
     * Id format: "vista:evr:<dataset_id>:<evr_name>"
     */
    var EVRType = new VISTAType({
        key: "vista.evr",
        name: "EVR",
        cssClass: "icon-object",
        pattern: /^evr:([a-zA-Z0-9\-:]+):([a-zA-Z0-9\-_]+)/,
        transform: function (match) {
            return {
                datasetIdentifier: VISTAType.toIdentifier(match[1]),
                name: match[2]
            };
        },
        getLocation: function (dataset, data) {
            // FIXME: this works soley because the dataset must have loaded for
            // the EVRType to load.
            return EVRModuleType.makeIdentifier(
                dataset.evrs.byName[data.name].module,
                data.datasetIdentifier
            );
        },
        makeId: function (datasetIdentifier, name) {
            return "evr:" + VISTAType.toKeyString(datasetIdentifier) + ":" + name;
        },
        makeObject: function (dataset, data) {
            if (dataset.hasEVRs()) {
                return dataset.evrs.load()
                    .then(() => {
                        var object = {
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
        
                        _.assignIn(object.telemetry, dataset.evrs.urls);
        
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

    return EVRType;

});
