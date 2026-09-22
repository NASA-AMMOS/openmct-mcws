import EVRLevelIndicatorTableRow from './EVRLevelIndicatorTableRow.js';

export default class EVRHistoricalContextTableRow extends EVRLevelIndicatorTableRow {
  getContextMenuActions() {
    return [
      'viewDatumAction',
      'vista.evr.view-historical-level',
      'vista.evr.view-historical-module',
      'vista.evr.view-historical-evr'
    ];
  }
}
