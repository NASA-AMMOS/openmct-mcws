import TelemetryTableColumn from 'openmct.tables.TelemetryTableColumn';

export default class DATColumn extends TelemetryTableColumn {
  getCellComponentName() {
    return 'vista-table-dat-cell';
  }
}
