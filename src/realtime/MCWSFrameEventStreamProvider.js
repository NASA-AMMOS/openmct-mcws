import MCWSStreamProvider from './MCWSStreamProvider';

/**
 * Provides real-time streaming DataProduct data.
 * @memberof {vista/telemetry}
 */
class MCWSFrameEventStreamProvider extends MCWSStreamProvider {
    /**
     * @param {Object} openmct The Open MCT API
     * @param {Object} vistaTime The Vista time API
     */
    constructor(openmct, vistaTime) {
        super(openmct, vistaTime);
    }

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

    /**
     * Notify the worker about a new value
     * @param {String} key The key
     * @param {*} value The value
     */
    notifyWorker(key, value) {
        super.notifyWorker(key, value);
    }
}

export default MCWSFrameEventStreamProvider;
