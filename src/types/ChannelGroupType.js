define([
    './VISTAType',
    './ChannelSourceType'
], function (
    VISTAType,
    ChannelSourceType
) {

    /**
     * Represents a Channel Group Node.
     *
     * Id format: "node:channel:<group_id>:<dataset_id>"
     */
    var ChannelGroupType = new VISTAType({
        key: "vista.channelGroup",
        name: "Group",
        cssClass: "icon-dictionary",
        pattern: /^node:channel:([a-zA-Z0-9\-\/_]+):([a-zA-Z0-9\-:]+)/,
        transform: function (match) {
            return {
                name: match[1],
                datasetIdentifier: VISTAType.toIdentifier(match[2])
            };

        },
        makeId: function (name, datasetIdentifier) {
            return [
                'node',
                'channel',
                name,
                VISTAType.toKeyString(datasetIdentifier)
            ].join(':');
        },
        getLocation: function (dataset, data) {
            return ChannelSourceType.makeIdentifier(data.datasetIdentifier);
        },
        getComposition: function (domainObject, dataset, data, types) {
            return dataset.channels.getGroupChannelIds(data.name)
                .then(function (channelIds) {
                    return channelIds.map(function (channelId) {
                        return types.Channel.makeIdentifier(
                            data.datasetIdentifier,
                            channelId
                        );
                    });
                });
        }
    });

    return ChannelGroupType;

});
