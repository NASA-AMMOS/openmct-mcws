import TelemetryTableRow from 'openmct.tables.TelemetryTableRow';
import { withCopySelected } from './copySelectedRows.js';

export default class CopyableTelemetryTableRow extends TelemetryTableRow {
  getContextMenuActions() {
    return withCopySelected(super.getContextMenuActions());
  }
}
