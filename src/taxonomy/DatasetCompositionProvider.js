import types from '../types/types.js';

/**
 * Composition provider for datasets.  Checks the defined properties of the
 * dataset and returns a list of options depending on what it has.
 */
class DatasetCompositionProvider {
  constructor(datasetCache) {
    this.datasetCache = datasetCache;
  }

  appliesTo(domainObject) {
    return domainObject.type === types.Dataset.key;
  }

  load(domainObject) {
    return this.datasetCache.get(domainObject).then((dataset) => {
      const nodes = [];
      if (dataset.channels) {
        nodes.push(types.ChannelSource.makeIdentifier(domainObject.identifier));
        nodes.push({
          namespace: 'vista-channel-alarms',
          key: [domainObject.identifier.namespace, domainObject.identifier.key].join(':')
        });
      }

      if (dataset.headerChannels) {
        nodes.push(types.HeaderChannelSource.makeIdentifier(domainObject.identifier));
      }

      if (dataset.evrs) {
        nodes.push(types.EVRSource.makeIdentifier(domainObject.identifier));
      }
      if (dataset.dictionaries) {
        nodes.push(types.DictionarySource.makeIdentifier(domainObject.identifier));
      }
      if (dataset.dataProducts) {
        nodes.push(types.DataProducts.makeIdentifier(domainObject.identifier));
      }
      if (dataset.packets) {
        nodes.push(types.Packets.makeIdentifier(domainObject.identifier));
      }
      if (dataset.options.commandEventUrl || dataset.options.commandEventStreamUrl) {
        nodes.push(types.CommandEvents.makeIdentifier(domainObject.identifier));
      }
      if (dataset.options.packetSummaryEventStreamUrl) {
        nodes.push(types.PacketSummaryEvents.makeIdentifier(domainObject.identifier));
      }
      if (dataset.messages) {
        nodes.push(types.Message.makeIdentifier(domainObject.identifier));
      }
      if (dataset.hasFrameSummary()) {
        nodes.push(types.FrameSummary.makeIdentifier(domainObject.identifier));
      }
      if (dataset.hasFrameEvent()) {
        nodes.push(types.FrameEvent.makeIdentifier(domainObject.identifier));
      }
      if (dataset.hasAlarmMessage()) {
        nodes.push(types.AlarmMessageStream.makeIdentifier(domainObject.identifier));
      }
      return nodes;
    });
  }
}

export default DatasetCompositionProvider;
