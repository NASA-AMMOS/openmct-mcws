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
});
