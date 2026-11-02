import TelemetryTableRow from 'openmct.tables.TelemetryTableRow';
import {
  COPY_SELECTED_ROWS_CSV_ACTION_KEY,
  COPY_SELECTED_ROWS_TAB_ACTION_KEY
} from './copySelectedRows.js';

export default class HistoricalContextTableRow extends TelemetryTableRow {
  getContextMenuActions() {
    return [
      'viewHistoricalData',
      COPY_SELECTED_ROWS_TAB_ACTION_KEY,
      COPY_SELECTED_ROWS_CSV_ACTION_KEY
    ];
  }
}
