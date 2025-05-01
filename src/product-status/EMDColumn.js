import TelemetryTableColumn from 'openmct.tables.TelemetryTableColumn';
export default class EMDColumn extends TelemetryTableColumn {
  getCellComponentName() {
    return 'vista-table-emd-cell';
  }
}
