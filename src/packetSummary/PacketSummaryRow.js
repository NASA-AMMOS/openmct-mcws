import TelemetryTableRow from 'openmct.tables.TelemetryTableRow';
import { withCopySelected } from 'lib/copySelectedRows';

export default class PacketSummaryRow extends TelemetryTableRow {
  constructor(datum, columns, objectKeyString, limitEvaluator, rowId) {
    super(datum, columns, objectKeyString, limitEvaluator);

    this.rowId = rowId;
  }

  getContextMenuActions() {
    return withCopySelected(super.getContextMenuActions());
  }

  update(incomingDatum) {
    this.datum = incomingDatum;
  }
}
