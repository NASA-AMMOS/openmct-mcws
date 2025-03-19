import MCWSStreamProvider from './MCWSStreamProvider';

/**
 * Provides real-time streaming DataProduct data.
 * @memberof {vista/telemetry}
 */
class MCWSFrameSummaryStreamProvider extends MCWSStreamProvider {
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
        return domainObject.telemetry?.frameSummaryStreamUrl;
    }

    /**
     * Get the key to use for this stream
     * @param {Object} domainObject The domain object
     * @returns {undefined} Always returns undefined to match on undefined properties
     */
    getKey() {
        // We return undefined so that we can match on undefined properties.
        return undefined;
    }

    /**
     * Get the property to use for this stream
     * @returns {String} The property name
     */
    getProperty() {
        // We just want something that returns undefined so it matches the
        // key above. Hacky.
        return 'some_undefined_property';
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

export default MCWSFrameSummaryStreamProvider;
