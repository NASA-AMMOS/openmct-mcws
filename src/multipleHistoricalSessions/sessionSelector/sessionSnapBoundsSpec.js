import {
  computeSessionSnapRange,
  getSessionTimeFields,
  widenEqualBounds
} from './sessionSnapBounds.js';

describe('sessionSnapBounds', () => {
  describe('getSessionTimeFields', () => {
    it('uses the legacy fields without a suffix for ERT', () => {
      expect(getSessionTimeFields('ert')).toEqual(['start_time', 'end_time']);
    });

    it('uses suffixed fields for SCET', () => {
      expect(getSessionTimeFields('scet')).toEqual(['start_time_scet', 'end_time_scet']);
    });

    it('uses suffixed fields for SCLK', () => {
      expect(getSessionTimeFields('sclk')).toEqual(['start_time_sclk', 'end_time_sclk']);
    });

    it('falls back to the start_time_<key> convention for unknown systems', () => {
      expect(getSessionTimeFields('lmst')).toEqual(['start_time_lmst', 'end_time_lmst']);
    });
  });

  describe('computeSessionSnapRange', () => {
    const parseDay = (value) => Date.parse(`${value}T00:00:00Z`);

    it('is unavailable when no sessions are selected', () => {
      expect(computeSessionSnapRange([], 'start_time', 'end_time', parseDay)).toEqual({
        available: false
      });
    });

    it('uses the single session bounds when one session is selected', () => {
      const sessions = [{ start_time: '2026-01-02', end_time: '2026-01-05' }];

      expect(computeSessionSnapRange(sessions, 'start_time', 'end_time', parseDay)).toEqual({
        available: true,
        start: parseDay('2026-01-02'),
        end: parseDay('2026-01-05')
      });
    });

    it('uses the earliest start and latest end across sessions', () => {
      const sessions = [
        { start_time: '2026-01-02', end_time: '2026-01-05' },
        { start_time: '2026-01-01', end_time: '2026-01-03' },
        { start_time: '2026-01-04', end_time: '2026-01-09' }
      ];

      expect(computeSessionSnapRange(sessions, 'start_time', 'end_time', parseDay)).toEqual({
        available: true,
        start: parseDay('2026-01-01'),
        end: parseDay('2026-01-09')
      });
    });

    it('compares parsed values, not raw strings', () => {
      // Lexicographic compare would pick '9' as the max; numeric parse picks 10.
      const sessions = [{ start_time: '9', end_time: '10' }];

      expect(
        computeSessionSnapRange(sessions, 'start_time', 'end_time', Number.parseFloat)
      ).toEqual({
        available: true,
        start: 9,
        end: 10
      });
    });

    it('skips sessions missing either field (mixed responses)', () => {
      const sessions = [
        { start_time: '2026-01-02', end_time: '2026-01-05' },
        { start_time: '2026-01-01' },
        { end_time: '2026-01-09' },
        {}
      ];

      expect(computeSessionSnapRange(sessions, 'start_time', 'end_time', parseDay)).toEqual({
        available: true,
        start: parseDay('2026-01-02'),
        end: parseDay('2026-01-05')
      });
    });

    it('skips null, undefined and empty field values', () => {
      const sessions = [
        { start_time: null, end_time: '2026-01-05' },
        { start_time: '2026-01-02', end_time: '' },
        { start_time: undefined, end_time: undefined }
      ];

      expect(computeSessionSnapRange(sessions, 'start_time', 'end_time', parseDay)).toEqual({
        available: false
      });
    });

    it('skips sessions whose values fail to parse', () => {
      const sessions = [
        { start_time: 'not-a-date', end_time: '2026-01-05' },
        { start_time: '2026-01-02', end_time: '2026-01-04' }
      ];

      expect(computeSessionSnapRange(sessions, 'start_time', 'end_time', parseDay)).toEqual({
        available: true,
        start: parseDay('2026-01-02'),
        end: parseDay('2026-01-04')
      });
    });

    it('skips sessions with start after end', () => {
      const sessions = [
        { start_time: '2026-01-09', end_time: '2026-01-01' },
        { start_time: '2026-01-02', end_time: '2026-01-04' }
      ];

      expect(computeSessionSnapRange(sessions, 'start_time', 'end_time', parseDay)).toEqual({
        available: true,
        start: parseDay('2026-01-02'),
        end: parseDay('2026-01-04')
      });
    });

    it('is unavailable when every session is skipped', () => {
      const sessions = [{ start_time: '2026-01-01' }, { end_time: '2026-01-09' }];

      expect(computeSessionSnapRange(sessions, 'start_time', 'end_time', parseDay)).toEqual({
        available: false
      });
    });
  });

  describe('widenEqualBounds', () => {
    it('passes unequal bounds through untouched', () => {
      expect(widenEqualBounds(100, 200, undefined)).toEqual({ start: 100, end: 200 });
    });

    it('uses formatter endOfDay for equal bounds when available', () => {
      const format = { endOfDay: jasmine.createSpy('endOfDay').and.returnValue(999) };

      expect(widenEqualBounds(100, 100, format)).toEqual({ start: 100, end: 999 });
      expect(format.endOfDay).toHaveBeenCalledWith(100);
    });

    it('adds one day in seconds for equal bounds without endOfDay (SCLK)', () => {
      expect(widenEqualBounds(100, 100, { parse: Number.parseFloat })).toEqual({
        start: 100,
        end: 100 + 86400
      });
    });

    it('adds one day in seconds when no formatter is provided', () => {
      expect(widenEqualBounds(100, 100, undefined)).toEqual({ start: 100, end: 100 + 86400 });
    });
  });
});
