import TelemetryTableRow from 'openmct.tables.TelemetryTableRow';

export default class HistoricalContextTableRow extends TelemetryTableRow {
  constructor(datum, columns, objectKeyString, limitEvaluator) {
    super(datum, columns, objectKeyString, limitEvaluator);
  }

  getContextMenuActions() {
    return ['viewHistoricalData'];
  }
}
