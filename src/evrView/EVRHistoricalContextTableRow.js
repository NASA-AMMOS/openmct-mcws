import EVRLevelIndicatorTableRow from './EVRLevelIndicatorTableRow.js';
import { COPY_SELECTED_ROWS_ACTION_KEY } from 'lib/copySelectedRows';

export default class EVRHistoricalContextTableRow extends EVRLevelIndicatorTableRow {
  getContextMenuActions() {
    return [
      'viewDatumAction',
      'vista.evr.view-historical-level',
      'vista.evr.view-historical-module',
      'vista.evr.view-historical-evr',
      COPY_SELECTED_ROWS_ACTION_KEY
    ];
  }
}
