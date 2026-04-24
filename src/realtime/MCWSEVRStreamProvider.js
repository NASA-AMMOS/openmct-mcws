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
    // This is the default cause for EVRs that contain a module.
    // only uppercase works for all mcws apis (lowercase will not work)
    // see https://github.com/NASA-AMMOS/openmct-mcws/pull/412/changes
    let module = domainObject?.telemetry?.definition?.module?.toUpperCase();

    // This is the top-level vista.evrModule object, which contains
    // a module definition but not in the definition object.
    // This must be captured before attempting legacy EVRs,
    // in case the module contains underscores.
    // only uppercase works for all mcws apis (lowercase will not work)
    // see https://github.com/NASA-AMMOS/openmct-mcws/pull/412/changes
    if (!module?.length) {
      module = domainObject?.telemetry?.module?.toUpperCase();
    }

    // legacy inference of module by evr_name
    // This should *never* occur with modern telemetry dictionaries.
    if (!module || module.length <= 0) {
      console.warn('Legacy domain objects should not be used anymore!');
      // only uppercase works for all mcws apis (lowercase will not work)
      // see https://github.com/NASA-AMMOS/openmct-mcws/pull/412/changes
      module = domainObject.telemetry.evr_name.split('_')[0].toUpperCase();
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
