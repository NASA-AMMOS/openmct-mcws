import {
  CommandStatusTracker,
  commandStem,
  formatDayOfYear,
  parseEventTime
} from './commandStatusTracker.js';

describe('CommandStatusTracker', () => {
  let tracker;

  beforeEach(() => {
    tracker = new CommandStatusTracker({ maxEntries: 3 });
  });

  describe('time helpers', () => {
    it('parses day-of-year and ISO times as UTC', () => {
      expect(parseEventTime('2026-285T16:04:06.429')).toBe(Date.UTC(2026, 9, 12, 16, 4, 6, 429));
      expect(parseEventTime('2026-10-12T16:04:06.429Z')).toBe(Date.UTC(2026, 9, 12, 16, 4, 6, 429));
      expect(parseEventTime('not a time')).toBe(null);
      expect(parseEventTime(undefined)).toBe(null);
    });

    it('formats day-of-year times', () => {
      expect(formatDayOfYear(Date.UTC(2026, 9, 12, 16, 4, 6, 9))).toBe('2026-285T16:04:06.009');
    });

    it('takes the stem from a command string', () => {
      expect(commandStem(' fsw_set_mode,SAFE')).toBe('FSW_SET_MODE');
    });
  });

  it('tracks dispatches newest first and caps the list', () => {
    ['A', 'B', 'C', 'D'].forEach((stem, index) => {
      tracker.track(
        { commandId: `c${index}`, dispatchTime: '2026-10-12T16:00:00Z' },
        {
          sessionId: 21,
          requested: stem
        }
      );
    });

    expect(tracker.entries.map((entry) => entry.commandId)).toEqual(['c3', 'c2', 'c1']);
    expect(tracker.entries[0]).toEqual(
      jasmine.objectContaining({ stem: 'D', status: 'Dispatched', final: false })
    );
  });

  it('matches events by commandId', () => {
    tracker.track(
      { commandId: 'c1', dispatchTime: '2026-10-12T16:00:00Z' },
      {
        sessionId: 21,
        requested: 'CMD_CONSTRAINT_OVERRIDE'
      }
    );
    tracker.ingest([{ commandId: 'c1', status: 'Radiated', final: 'true', scmf_file: 'x.scmf' }]);

    expect(tracker.entries[0]).toEqual(
      jasmine.objectContaining({
        status: 'Radiated',
        final: true,
        scmfFile: 'x.scmf',
        matchedBy: 'commandId'
      })
    );
    expect(tracker.hasPending()).toBe(false);
  });

  it('falls back to session and stem, oldest first, and follows the request id', () => {
    tracker.track(
      { commandId: 'old', dispatchTime: '2026-10-12T16:00:00Z' },
      {
        sessionId: 21,
        requested: 'SYNC_CLOCKS'
      }
    );
    tracker.track(
      { commandId: 'new', dispatchTime: '2026-10-12T16:00:05Z' },
      {
        sessionId: 21,
        requested: 'SYNC_CLOCKS'
      }
    );

    tracker.ingest({
      session_id: '21',
      command_string: 'SYNC_CLOCKS',
      event_time: '2026-285T16:00:01.000',
      request_id: 'FSW-1',
      status: 'Radiating'
    });
    tracker.ingest({
      session_id: '21',
      command_string: 'SYNC_CLOCKS',
      event_time: '2026-285T16:00:02.000',
      request_id: 'FSW-1',
      status: 'Radiated',
      final: true
    });

    const [newest, oldest] = tracker.entries;

    expect(oldest).toEqual(
      jasmine.objectContaining({ status: 'Radiated', final: true, requestId: 'FSW-1' })
    );
    expect(oldest.matchedBy).toBe('session');
    expect(newest.status).toBe('Dispatched');
  });

  it('ignores events from other sessions, other stems, or long before dispatch', () => {
    tracker.track(
      { commandId: 'c1', dispatchTime: '2026-10-12T16:00:10Z' },
      {
        sessionId: 21,
        requested: 'SYNC_CLOCKS'
      }
    );
    tracker.ingest([
      { session_id: 22, command_string: 'SYNC_CLOCKS', status: 'Radiated' },
      { session_id: 21, command_string: 'OTHER', status: 'Radiated' },
      {
        session_id: 21,
        command_string: 'SYNC_CLOCKS',
        event_time: '2026-285T15:59:00.000',
        status: 'Radiated'
      },
      null
    ]);

    expect(tracker.entries[0].status).toBe('Dispatched');
    expect(tracker.earliestPendingTime()).toBe(Date.UTC(2026, 9, 12, 16, 0, 10));
  });
});
