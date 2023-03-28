define([
    'openmct.tables.TelemetryTableColumn'
], function (TelemetryTableColumn) {
    return class EMDColumn extends TelemetryTableColumn {
        getCellComponentName() {
            return 'vista-table-emd-cell';
        }
    }
});