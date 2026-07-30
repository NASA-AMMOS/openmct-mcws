import VISTAType from './VISTAType.js';

const valueType = {
  session_id: 'number',
  vcid: 'number',
  dss_id: 'string',
  apid: 'number',
  spsc: 'number',
  length: 'number',
  source_vcfc: 'number',
  record_type: 'string',
  session_host: 'string',
  apid_name: 'string',
  from_sse: 'string'
};

function startCase(str) {
  return str
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Represents a Packets node.
 *
 * Id format: "vista:packets:<dataset_id>"
 */
const PacketsType = new VISTAType({
  key: 'vista.packets',
  name: 'Packets',
  cssClass: 'icon-telemetry',
  pattern: /^packets:([a-zA-Z0-9-:]+)/,
  transform: function (match) {
    return {
      datasetIdentifier: VISTAType.toIdentifier(match[1])
    };
  },
  makeId: function (datasetIdentifier) {
    return 'packets:' + VISTAType.toKeyString(datasetIdentifier);
  },
  makeObject: function (dataset, data) {
    return Promise.resolve({
      name: 'Packets',
      type: this.key,
      location: this.getLocation(dataset, data),
      telemetry: {
        dataProductUrl: dataset.options.packetUrl,
        dataProductContentUrl: dataset.options.packetContentUrl,
        mcwsVersion: dataset.version,
        values: [
          'record_type',
          'session_id',
          'session_host',
          'vcid',
          'dss_id',
          'apid',
          'apid_name',
          'from_sse',
          'spsc',
          'length',
          'source_vcfc'
        ].map((key, index) => {
          return {
            key: key,
            name: startCase(key),
            format: valueType[key],
            hints: {
              domain: index
            }
          };
        })
      }
    });
  }
});

export default PacketsType;
