import VISTAType from './VISTAType'
import HeaderChannelSourceType from './HeaderChannelSourceType'

export default new VISTAType({
    key: "vista.headerChannel",
    name: "Header Channel",
    cssClass: "icon-telemetry",
    pattern: /^header-channel:([a-zA-Z0-9\-:]+):([a-zA-Z0-9\-]+)/,
    transform: function (match) {
        return {
            datasetIdentifier: VISTAType.toIdentifier(match[1]),
            channelId: match[2]
        };
    },
    makeId: function (datasetIdentifier, channelId) {
        return `header-channel:${VISTAType.toKeyString(datasetIdentifier)}:${channelId}`;
    },
    getLocation: function (dataset, data) {
        return HeaderChannelSourceType.makeIdentifier(
            data.datasetIdentifier
        );
    },
    makeObject: function (dataset, data) {
        const name = data.channelId || 'MISSING CHANNEL ID'
        let object = {
            name: name,
            type: this.key,
            location: this.getLocation(dataset, data),
            telemetry: {
                mcwsVersion: dataset.version,
                channel_id: data.channelId,
                values: [
                    {
                        key: 'channel_id',
                        name: 'ID',
                        format: 'string'
                    },
                    {
                        key: 'dss_id',
                        name: 'DSS (station)'
                    },
                    {
                        key: 'dn_alarm_state',
                        name: 'DN Alarm Status',
                        format: 'string'
                    },
                    {
                        key: 'eu_alarm_state',
                        name: 'EU Alarm Status',
                        format: 'string'
                    },
                ]
            }
        };

        if (dataset.hasHeaderChannels()) {
            _.assignIn(object.telemetry, dataset.headerChannels.urls);
        }

        return Promise.resolve(object);
    }
})