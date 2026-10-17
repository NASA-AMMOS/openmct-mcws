import ChannelTable from './ChannelTable.js';

describe('ChannelTable', () => {
  describe('updateTelemetryMode', () => {
    let channelTable;
    let clearAndResubscribeSpy;

    beforeEach(() => {
      clearAndResubscribeSpy = jasmine.createSpy('clearAndResubscribe');

      // Construct without running TelemetryTable's constructor (which pulls in
      // configuration/time-system wiring irrelevant to this method); only the
      // properties updateTelemetryMode actually reads are needed here.
      channelTable = Object.create(ChannelTable.prototype);
      channelTable.telemetryMode = 'unlimited';
      channelTable.clearAndResubscribe = clearAndResubscribeSpy;
      channelTable.tableRows = {
        setLimit: jasmine.createSpy('setLimit'),
        removeLimit: jasmine.createSpy('removeLimit')
      };
    });

    it('ignores telemetry mode changes (issue #299)', () => {
      channelTable.updateTelemetryMode('performance');

      expect(channelTable.telemetryMode).toBe('unlimited');
      expect(clearAndResubscribeSpy).not.toHaveBeenCalled();
    });

    it('does not resubscribe when already in the requested mode', () => {
      channelTable.updateTelemetryMode('unlimited');

      expect(channelTable.telemetryMode).toBe('unlimited');
      expect(clearAndResubscribeSpy).not.toHaveBeenCalled();
    });
  });

  describe('marking fixes', () => {
    it('makes columns selectable only while editing', () => {
      let editing = false;
      const channelTable = Object.create(ChannelTable.prototype);
      channelTable.openmct = {
        editor: {
          isEditing: () => editing
        },
        telemetry: {
          getValueFormatter: () => ({})
        }
      };

      const column = channelTable.createColumn({ key: 'value', name: 'Value' });

      expect(column.selectable).toBe(false);

      editing = true;

      expect(column.selectable).toBe(true);
    });

    it('unpause clears marks on current rows before resuming', () => {
      const rows = [{ marked: true }, { marked: false }, {}];
      const runDelayedActionsSpy = jasmine.createSpy('runDelayedActions');
      const channelTable = Object.create(ChannelTable.prototype);
      channelTable.tableRows = {
        getRows: () => rows
      };
      channelTable.paused = true;
      channelTable.delayedActions = [];
      channelTable.runDelayedActions = runDelayedActionsSpy;

      channelTable.unpause();

      expect(rows.every((row) => row.marked === false)).toBe(true);
      expect(channelTable.paused).toBe(false);
      expect(runDelayedActionsSpy).toHaveBeenCalled();
    });
  });

  describe('initialize', () => {
    it('does not observe configuration.filters (issue #299)', () => {
      const domainObject = {
        type: 'vista.chanTableGroup',
        configuration: {}
      };
      const observeSpy = jasmine.createSpy('observe');

      const channelTable = Object.create(ChannelTable.prototype);
      channelTable.domainObject = domainObject;
      channelTable.openmct = {
        objects: {
          observe: observeSpy
        }
      };
      channelTable.reorder = () => {};
      channelTable.loadComposition = () => {};
      channelTable.tableComposition = {
        on: () => {}
      };

      channelTable.initialize();

      expect(observeSpy).not.toHaveBeenCalledWith(
        domainObject,
        'configuration.filters',
        jasmine.anything()
      );
    });
  });
});
