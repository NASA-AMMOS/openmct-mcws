import TelemetryTableRow from 'openmct.tables.TelemetryTableRow';

export default class FrameWatchRow extends TelemetryTableRow {
    constructor(datum, columns, objectKeyString, limitEvaluator, rowId) {
        super(datum, columns, objectKeyString, limitEvaluator);

        this.rowId = rowId;
    }

    update(datum) {
        this.datum = datum;
    }

    getParsedValue(key) {
        let column = this.columns[key];

        return column && column.getParsedValue(this.datum[key]);
    }
}
