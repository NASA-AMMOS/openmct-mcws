import MCWSStreamProvider from './MCWSStreamProvider';

/**
 * Provides real-time streaming DataProduct data.
 * @memberof {vista/telemetry}
 */
class MCWSMessageStreamProvider extends MCWSStreamProvider {
    /**
     * Subscribe to real-time updates for this domain object
     * @param {Object} domainObject The domain object
     * @param {Function} callback The callback to invoke with new data
     * @param {Object} options Additional options
     * @returns {Function} A function that will unsubscribe when called
     */
    subscribe(domainObject, callback, options) {
        const messageType = domainObject.identifier.key.split(':')[0];
        options.filters = options.filters || {};

        if (messageType === 'CommandMessages') {
            options.filters.message_type = {'equals': [
                'HardwareCommand',
                'FlightSoftwareCommand',
                'SequenceDirective',
                'SseCommand',
                'FileLoad',
                'SCMF',
                'RawUplinkData',
                'CpdUplinkStatus'
            ]};
        }

        return super.subscribe(domainObject, callback, options);
    }

    /**
     * Get the URL for streaming data for this domain object
     * @param {Object} domainObject The domain object
     * @returns {String} The URL to use for streaming
     */
    getUrl(domainObject) {
        return domainObject.telemetry?.messageStreamUrl;
    }

    /**
     * Get the key to use for this stream
     * @param {Object} domainObject The domain object
     * @returns {String|undefined} The key
     */
    getKey(domainObject) {
        //if it is the mock domainObject used in ClearDataOnMessage.js
        if (domainObject.identifier.key === 'message::clear-data-static-object') {
            return domainObject.telemetry.key;
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
        if (domainObject.identifier.key === 'message::clear-data-static-object') {
            return domainObject.telemetry.property;
        } else {
            return 'some_undefined_property';
        }
    }
}

export default MCWSMessageStreamProvider;
