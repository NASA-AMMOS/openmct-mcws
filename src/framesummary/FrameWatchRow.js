import TelemetryTableRow from 'openmct.tables.TelemetryTableRow';
import { withCopySelected } from 'lib/copySelectedRows';

export default class FrameWatchRow extends TelemetryTableRow {
  constructor(datum, columns, objectKeyString, limitEvaluator, rowId) {
    super(datum, columns, objectKeyString, limitEvaluator);

    this.rowId = rowId;
  }

  getContextMenuActions() {
    return withCopySelected(super.getContextMenuActions());
  }

  update(datum) {
    this.datum = datum;
  }

  getParsedValue(key) {
    let column = this.columns[key];

    return column && column.getParsedValue(this.datum[key]);
  }
}
