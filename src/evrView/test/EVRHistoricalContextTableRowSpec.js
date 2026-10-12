import EVRHistoricalContextTableRow from '../EVRHistoricalContextTableRow.js';

describe('EVRHistoricalContextTableRow', () => {
  it('offers the datum action and the three EVR-specific historical data actions', () => {
    const row = new EVRHistoricalContextTableRow({}, {}, 'vista:evr:vista:DATASET1:SOME_EVR', {});

    expect(row.getContextMenuActions()).toEqual([
      'viewDatumAction',
      'vista.evr.view-historical-level',
      'vista.evr.view-historical-module',
      'vista.evr.view-historical-evr'
    ]);
  });
});
