import MCWSStreamProvider from './MCWSStreamProvider.js';

/**
 * Provides real-time streaming PacketSummaryEvent data.
 * @memberof {vista/telemetry}
 */
class MCWSPacketSummaryEventProvider extends MCWSStreamProvider {
  /**
   * Get the URL for streaming data for this domain object
   * @param {Object} domainObject The domain object
   * @returns {String} The URL to use for streaming
   */
  getUrl(domainObject) {
    return domainObject.telemetry?.packetSummaryEventStreamUrl;
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
    // key above.  Hacky.
    return 'some_undefined_property';
  }
}

export default MCWSPacketSummaryEventProvider;
