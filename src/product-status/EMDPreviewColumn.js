import TelemetryTableColumn from 'openmct.tables.TelemetryTableColumn';

export default class EMDPreviewColumn extends TelemetryTableColumn {
  getCellComponentName() {
    return 'vista-table-emd-preview-cell';
  }
}
