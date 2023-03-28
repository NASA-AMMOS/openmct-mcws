define([
    'openmct.tables.TelemetryTableRow'
], function (TelemetryTableRow) {
    class HistoricalContextTableRow extends TelemetryTableRow {
        constructor(datum, columns, objectKeyString, limitEvaluator) {
            super(datum, columns, objectKeyString, limitEvaluator);
        }

        getContextMenuActions() {
            return ['viewHistoricalData'];
        }
    }
    return HistoricalContextTableRow;
});
