import VISTAType from './VISTAType.js';

/**
 * Represents a Channel Source in a dataset, a node that contains all
 * channels in a specific dataset.
 *
 * Id format: "vista:source:channel:<dataset_id>"
 */
const ChannelSourceType = new VISTAType({
  key: 'vista.channelSource',
  name: 'Channels',
  cssClass: 'icon-dictionary',
  pattern: /^source:channel:([a-zA-Z0-9-:]+)/,
  transform: function (match) {
    return {
      datasetIdentifier: VISTAType.toIdentifier(match[1])
    };
  },
  makeId: function (datasetIdentifier) {
    return 'source:channel:' + VISTAType.toKeyString(datasetIdentifier);
  },
  getComposition: function (domainObject, dataset, data, types) {
    return dataset.channels.getGroups().then((groups) => {
      return groups.map((group) => {
        return types.ChannelGroup.makeIdentifier(group.key, data.datasetIdentifier);
      });
    });
  }
});

export default ChannelSourceType;
