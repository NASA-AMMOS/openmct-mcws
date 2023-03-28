define([
    'openmct.tables.TelemetryTableColumn'
], function (TelemetryTableColumn) {
    return class EMDPreviewColumn extends TelemetryTableColumn {
        getCellComponentName() {
            return 'vista-table-emd-preview-cell';
        }
    }
});