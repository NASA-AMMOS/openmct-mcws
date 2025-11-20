import MCWSStreamProvider from './MCWSStreamProvider.js';

/**
 * Provides real-time streaming DataProduct data.
 * @memberof {vista/telemetry}
 */
class MCWSDataProductStreamProvider extends MCWSStreamProvider {
  getUrl(domainObject) {
    return domainObject.telemetry?.dataProductStreamUrl;
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

  subscribe(domainObject, callback, options) {
    function wrappedCallback(datum) {
      let sessionId = datum.session_id;

      if (datum.unique_name !== undefined) {
        let uniqueName = datum.unique_name.replace(/\.dat$/, '');
        let filter = '(session_id=' + sessionId + ',unique_name=' + uniqueName + ')';
        let params = '?filter=' + filter + '&filetype=';
        let base_url = domainObject.telemetry.dataProductContentUrl + params;
        datum.emd_url = base_url + '.emd';
        datum.emd_preview = base_url + '.emd';
        datum.dat_url = base_url + '.dat';
        datum.txt_url = base_url.replace('DataProductContent', 'DataProductView') + '.dat';
      }

      callback(datum);
    }

    return super.subscribe(domainObject, wrappedCallback, options);
  }
}

export default MCWSDataProductStreamProvider;
