define([
    'openmct.tables.TelemetryTableColumn'
], function (TelemetryTableColumn) {
    return class DATColumn extends TelemetryTableColumn {
        getCellComponentName() {
            return 'vista-table-dat-cell';
        }
    }
});