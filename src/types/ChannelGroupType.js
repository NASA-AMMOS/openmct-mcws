import VISTAType from './VISTAType.js';
import ChannelSourceType from './ChannelSourceType.js';

/**
 * Represents a Channel Group Node.
 *
 * Id format: "node:channel:<group_id>:<dataset_id>"
 */
const ChannelGroupType = new VISTAType({
  key: 'vista.channelGroup',
  name: 'Group',
  cssClass: 'icon-dictionary',
  pattern: /^node:channel:([a-zA-Z0-9/_-]+):([a-zA-Z0-9-:]+)/,
  transform: function (match) {
    return {
      name: match[1],
      datasetIdentifier: VISTAType.toIdentifier(match[2])
    };
  },
  makeId: function (name, datasetIdentifier) {
    return ['node', 'channel', name, VISTAType.toKeyString(datasetIdentifier)].join(':');
  },
  getLocation: function (dataset, data) {
    return ChannelSourceType.makeIdentifier(data.datasetIdentifier);
  },
  getComposition: function (domainObject, dataset, data, types) {
    return dataset.channels.getGroupChannelIds(data.name).then((channelIds) => {
      return channelIds.map((channelId) => {
        return types.Channel.makeIdentifier(data.datasetIdentifier, channelId);
      });
    });
  }
});

export default ChannelGroupType;
