define([
    'openmct.tables.TelemetryTableColumn'
], function (TelemetryTableColumn) {
    return class TXTColumn extends TelemetryTableColumn {
        getCellComponentName() {
            return 'vista-table-txt-cell';
        }
    };
});
