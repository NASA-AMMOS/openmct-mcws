import TelemetryTableRow from 'openmct.tables.TelemetryTableRow';

export default class EVRLevelIndicatorTableRow extends TelemetryTableRow {
    constructor(datum, columns, objectKeyString, limitEvaluator, levels) {
        super(datum, columns, objectKeyString, limitEvaluator);

        this.levels = levels;
    }

    getRowClass() {
        if (!this.rowClass) {
            let limitEvaluation = this.limitEvaluator.evaluate(this.datum, undefined, this.levels);
            this.rowClass = limitEvaluation && limitEvaluation.cssClass;
        }

        return this.rowClass;
    }

    getCellLimitClasses() {
        return {};
    }
}
