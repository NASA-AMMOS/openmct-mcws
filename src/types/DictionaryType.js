define([
    './VISTAType',
    './DictionarySourceType'
], function (
    VISTAType,
    DictionarySourceType
) {


    /**
     * Represents a dictionary in a specific dataset; e.g. a
     * channelDictionary.
     *
     * Id format: "vista:dictionary:<dataset_id>:<url_property>"
     */
    var DictionaryType = new VISTAType({
        key: "vista.dictionary",
        name: "Dictionary",
        cssClass: "icon-dictionary",
        pattern: /^dictionary:([a-zA-Z0-9\-:]+):([a-zA-Z]+)/,
        transform: function (match) {
            return {
                datasetIdentifier: VISTAType.toIdentifier(match[1]),
                url_property: match[2],
                name: {
                    'channelDictionaryUrl': 'Channel Dictionary',
                    'channelEnumerationDictionaryUrl': 'Channel Enumeration Dictionary',
                    'eventRecordDictionaryUrl': 'Event Record Dictionary'
                }[match[2]]
            };
        },
        getLocation: function (dataset, data) {
            return DictionarySourceType.makeIdentifier(
                data.datasetIdentifier
            );
        },
        makeId: function (datasetIdentifier, url_property) {
            return "dictionary:" + VISTAType.toKeyString(datasetIdentifier) + ":" + url_property;
        },
        makeObject: function (dataset, data) {
            return VISTAType.prototype.makeObject.apply(this, arguments)
                .then(function (object) {
                    object.dataTablePath = dataset.options[data.url_property];
                    return object;
                });
        }
    });

    return DictionaryType;


});
