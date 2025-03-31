import MCWSStreamProvider from './MCWSStreamProvider';

/**
 * Provides real-time streaming DataProduct data.
 * @memberof {vista/telemetry}
 */
class MCWSFrameEventStreamProvider extends MCWSStreamProvider {
    /**
     * Get the URL for streaming data for this domain object
     * @param {Object} domainObject The domain object
     * @returns {String} The URL to use for streaming
     */
    getUrl(domainObject) {
        return domainObject.telemetry?.frameEventStreamUrl;
    }

    /**
     * Get the key to use for this stream
     * @param {Object} domainObject The domain object
     * @returns {String} The key
     */
    getKey(domainObject) {
        if (domainObject.type === 'vista.frame-event-filter') {
            const frameEventType = domainObject.identifier.key.split(':')[0];
            return frameEventType;
        } else {
            return undefined;
        }
    }

    /**
     * Get the property to use for this stream
     * @param {Object} domainObject The domain object
     * @returns {String} The property name
     */
    getProperty(domainObject) {
        if (domainObject.type === 'vista.frame-event-filter') {
            return 'message_type';
        } else {
            return 'some_undefined_property';
        }
    }
}

export default MCWSFrameEventStreamProvider;
