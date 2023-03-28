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
     * Represents a Dictionary Source in a dataset, a node that contains all
     * Dictionaries in a specific dataset.
     *
     * Id format: "vista:source:dictionary:<dataset_id>"
     */
    var DictionarySourceType = new VISTAType({
        key: "vista.dictionarySource",
        name: "Dictionaries",
        cssClass: "icon-dictionary",
        pattern: /^source:dictionary:([a-zA-Z0-9\-:]+)/,
        transform: function (match) {
            return {
                datasetIdentifier: VISTAType.toIdentifier(match[1])
            };
        },
        makeId: function (datasetIdentifier) {
            return "source:dictionary:" + VISTAType.toKeyString(datasetIdentifier);
        },
        getComposition: function (domainObject, dataset, data, types) {
            var composition = _(dataset.options)
                .pick(constants.DICTIONARY_PROPERTIES)
                .map(function (value, key) {
                    return types.Dictionary.makeIdentifier(
                            data.datasetIdentifier,
                            key
                        );
                })
                .value();

            return Promise.resolve(composition);
        }
    });

    return DictionarySourceType;

});
