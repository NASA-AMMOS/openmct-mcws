define([
    './VISTAType'
], function (
    VISTAType
) {

    /**
     * Represents a Channel Source in a dataset, a node that contains all
     * channels in a specific dataset.
     *
     * Id format: "vista:source:channel:<dataset_id>"
     */
    var ChannelSourceType = new VISTAType({
        key: "vista.channelSource",
        name: "Channels",
        cssClass: "icon-dictionary",
        pattern: /^source:channel:([a-zA-Z0-9\-:]+)/,
        transform: function (match) {
            var identifierParts = match[1].split(':');
            return {
                datasetIdentifier: VISTAType.toIdentifier(match[1])
            };
        },
        makeId: function (datasetIdentifier) {
            return "source:channel:" + VISTAType.toKeyString(datasetIdentifier);
        },
        getComposition: function (domainObject, dataset, data, types) {
            return dataset.channels.getGroups()
                .then(function (groups) {
                    return groups.map(function (group) {
                        return types.ChannelGroup.makeIdentifier(
                            group.key,
                            data.datasetIdentifier
                        );
                    });
                });
        }
    });

    return ChannelSourceType;
});
