import MCWSStreamProvider from './MCWSStreamProvider.js';

/**
 * Provides real-time streaming EVR data.
 * @memberof {vista/telemetry}
 */
class MCWSEVRStreamProvider extends MCWSStreamProvider {
  /**
   * Get the URL for streaming data for this domain object
   * @param {Object} domainObject The domain object
   * @returns {String} The URL to use for streaming
   */
  getUrl(domainObject) {
    if (domainObject.telemetry?.evrStreamUrl && !domainObject.telemetry?.level) {
      return domainObject.telemetry.evrStreamUrl;
    }
  }

  /**
   * Get the property to use for this stream
   * @param {Object} domainObject The domain object
   * @returns {String} The property name
   */
  getProperty() {
    return 'module';
  }

  /**
   * Get the key to use for this stream
   * @param {Object} domainObject The domain object
   * @returns {String} The key
   */
  getKey(domainObject) {
    // Can subscribe only by EVR module even if subscribing by EVR
    let module =
      domainObject.telemetry &&
      domainObject.telemetry.definition &&
      domainObject.telemetry.definition.module &&
      domainObject.telemetry.definition.module.toLowerCase();

    // legacy inference of module by evr_name
    // if this fallback is used will break on module names containing underscores
    if (!module || module.length <= 0) {
      console.warn('Legacy domain objects should not be used anymore!');
      module = domainObject.telemetry.evr_name
        ? domainObject.telemetry.evr_name.split('_')[0].toLowerCase()
        : domainObject.telemetry.module.toLowerCase();
    }

    return module;
  }

  /**
   * Subscribe to real-time updates for this domain object
   * @param {Object} domainObject The domain object
   * @param {Function} callback The callback to invoke with new data
   * @param {Object} options Additional options
   * @returns {Function} A function that will unsubscribe when called
   */
  subscribe(domainObject, callback, options) {
    // EVR Source subscription
    if (domainObject.telemetry.modules) {
      return this.multiSubscribe(domainObject, callback, options);
    }

    if (domainObject.telemetry.evr_name) {
      const wrappedCallback = (value) => {
        if (value.name === domainObject.telemetry.evr_name) {
          callback(value);
        }
      };
      return super.subscribe(domainObject, wrappedCallback, options);
    }
    return super.subscribe(domainObject, callback, options);
  }

  /**
   * Subscribe to multiple modules
   * @param {Object} domainObject The domain object
   * @param {Function} callback The callback to invoke with new data
   * @param {Object} options Additional options
   * @returns {Function} A function that will unsubscribe when called
   */
  multiSubscribe(domainObject, callback, options) {
    const unsubscribes = domainObject.telemetry.modules.map((module) => {
      const moduleObject = {
        telemetry: {
          evrStreamUrl: domainObject.telemetry.evrStreamUrl,
          module: module
        }
      };

      return super.subscribe(moduleObject, callback, options);
    });

    return () => {
      unsubscribes.forEach((unsubscribe) => {
        unsubscribe();
      });
    };
  }
}

export default MCWSEVRStreamProvider;
