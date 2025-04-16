import MCWSStreamProvider from './MCWSStreamProvider';

/**
 * Provides real-time streaming channel data.
 * @memberof {vista/telemetry}
 */
class MCWSChannelStreamProvider extends MCWSStreamProvider {
    getUrl(domainObject) {
        return domainObject.telemetry?.channelStreamUrl;
    }

    getKey(domainObject) {
        return domainObject.telemetry.channel_id;
    }

    getProperty() {
        return 'channel_id';
    }
}

export default MCWSChannelStreamProvider;
