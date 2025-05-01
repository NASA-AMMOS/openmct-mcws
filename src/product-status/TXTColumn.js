import TelemetryTableColumn from 'openmct.tables.TelemetryTableColumn';
export default class TXTColumn extends TelemetryTableColumn {
  getCellComponentName() {
    return 'vista-table-txt-cell';
  }
}
