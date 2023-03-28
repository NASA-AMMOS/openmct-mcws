import VISTAType from './VISTAType'

export default new VISTAType({
    key: "vista.headerChannelSource",
    name: "Header Channels",
    cssClass: "icon-dictionary",
    pattern: /^source:header-channel:([a-zA-Z0-9\-:]+)/,
    transform: function (match) {
        return { datasetIdentifier: VISTAType.toIdentifier(match[1]) };
    },
    makeId: function (datasetIdentifier) {
        return `source:header-channel:${VISTAType.toKeyString(datasetIdentifier)}`;
    },
    getComposition: function (domainObject, dataset, data, types) {
        if (dataset.hasHeaderChannels()) {
            return dataset.load()
                .then(() => {
                    const { headerChannels: { headerChannelsString} } = dataset;
                    return headerChannelsString.split(',')
                        .map(str => {
                            const match = str.match(/\d/g);
                            return types.HeaderChannel.makeIdentifier(
                                data.datasetIdentifier,
                                match ? 'H-' + match.join('') : `INVALID-CHANNEL-${str.replace(/\s/g, '')}`
                            )
                    });
                });
        }
        return Promise.resolve([]);
    }
})
