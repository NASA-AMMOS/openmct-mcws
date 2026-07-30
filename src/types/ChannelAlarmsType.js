import VISTAType from './VISTAType.js';

const ChannelAlarmsType = new VISTAType({
  key: 'vista.channelAlarms',
  name: 'Channel Alarms',
  cssClass: 'icon-telemetry',
  pattern: /^vista-channel-alarms:([a-zA-Z0-9\-:]+)/,
  transform: function (match) {
    const identifierParts = match[1].split(':');
    return {
      datasetIdentifier: {
        namespace: identifierParts[0],
        key: identifierParts[1]
      }
    };
  },
  makeObject: function (dataset, data) {
    return VISTAType.prototype.makeObject.call(this, dataset, data).then((object) => {
      object.telemetry.mcwsVersion = dataset.version;
      object.telemetry.channelHistoricalUrl = dataset.options.channelHistoricalUrl;
      return object;
    });
  },
  makeId: function (datasetIdentifier) {
    return (
      'vista-channel-alarms:' + [datasetIdentifier.namespace, datasetIdentifier.key].join(':')
    );
  }
});

export default ChannelAlarmsType;
