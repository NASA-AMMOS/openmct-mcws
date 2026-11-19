import AlarmsTable from '../AlarmsTable.js';
import AlarmsViewHistoricalContextTableRow from '../AlarmsViewHistoricalContextTableRow.js';

describe('AlarmsTable', () => {
  describe('resetRowsFromAllData', () => {
    let alarmsTable;
    let clearRowsFromTableAndFilterSpy;
    let datum;

    beforeEach(() => {
      datum = { channel_id: '12345', session_id: '1' };
      clearRowsFromTableAndFilterSpy = jasmine.createSpy('clearRowsFromTableAndFilter');

      // Construct without running TelemetryTable's constructor (which pulls in
      // configuration/time-system wiring irrelevant to this method); only the
      // properties resetRowsFromAllData actually reads are needed here.
      alarmsTable = Object.create(AlarmsTable.prototype);
      alarmsTable.telemetryObjects = {
        'vista:alarm-message-stream:vista:DATASET1': {
          columnMap: {},
          limitEvaluator: {}
        }
      };
      alarmsTable.telemetryCollections = {
        'vista:alarm-message-stream:vista:DATASET1': {
          getAll: () => [datum]
        }
      };
      alarmsTable.tableRows = {
        clearRowsFromTableAndFilter: clearRowsFromTableAndFilterSpy
      };
    });

    it('rebuilds rows as AlarmsViewHistoricalContextTableRow instances', () => {
      alarmsTable.resetRowsFromAllData();

      expect(clearRowsFromTableAndFilterSpy).toHaveBeenCalledTimes(1);

      const rows = clearRowsFromTableAndFilterSpy.calls.argsFor(0)[0];

      expect(rows.length).toBe(1);
      expect(rows[0] instanceof AlarmsViewHistoricalContextTableRow).toBe(true);
      expect(rows[0].datum.channel_id).toBe('12345');
    });

    it('rebuilds rows from every telemetry collection', () => {
      alarmsTable.telemetryObjects.otherKeyString = { columnMap: {}, limitEvaluator: {} };
      alarmsTable.telemetryCollections.otherKeyString = {
        getAll: () => [{ channel_id: '999', session_id: '2' }]
      };

      alarmsTable.resetRowsFromAllData();

      const rows = clearRowsFromTableAndFilterSpy.calls.argsFor(0)[0];

      expect(rows.length).toBe(2);
    });
  });
});
