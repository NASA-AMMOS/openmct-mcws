import MCWSStreamProvider from './MCWSStreamProvider';

/**
 * Provides real-time streaming EVR data by level.
 * @memberof {vista/telemetry}
 */
class MCWSEVRLevelStreamProvider extends MCWSStreamProvider {
    /**
     * Get the URL for streaming data for this domain object
     * @param {Object} domainObject The domain object
     * @returns {String} The URL to use for streaming
     */
    getUrl(domainObject) {
        if (domainObject.telemetry?.evrStreamUrl) {
            return domainObject.telemetry.evrStreamUrl;
        }
    }

    /**
     * Get the property to use for this stream
     * @param {Object} domainObject The domain object
     * @returns {String} The property name
     */
    getProperty() {
        return 'level';
    }

    /**
     * Get the key to use for this stream
     * @param {Object} domainObject The domain object
     * @returns {String} The key
     */
    getKey(domainObject) {
        return domainObject.telemetry.level;
    }
}

export default MCWSEVRLevelStreamProvider;
