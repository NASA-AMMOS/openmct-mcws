import MCWSStreamProvider from './MCWSStreamProvider';

/**
 * Provides real-time streaming CommandEvent data.
 * @memberof {vista/telemetry}
 */
class MCWSCommandStreamProvider extends MCWSStreamProvider {
  getUrl(domainObject) {
    return domainObject.telemetry?.commandEventStreamUrl;
  }

  getKey() {
    // We return undefined so that we can match on undefined properties.
    return undefined;
  }

  getProperty() {
    // We just want something that returns undefined so it matches the
    // key above.  Hacky.
    return 'some_undefined_property';
  }
}

export default MCWSCommandStreamProvider;
