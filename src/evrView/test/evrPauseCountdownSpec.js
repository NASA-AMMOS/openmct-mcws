import createEvrPauseCountdown, {
  formatPauseCountdown,
  normalizePauseTimerSeconds,
  observePauseTimerSeconds
} from '../evrPauseCountdown.js';

describe('evrPauseCountdown', () => {
  beforeEach(() => {
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  describe('normalizePauseTimerSeconds', () => {
    it('returns null when the setting is absent or cleared', () => {
      expect(normalizePauseTimerSeconds(undefined)).toBeNull();
      expect(normalizePauseTimerSeconds(null)).toBeNull();
      expect(normalizePauseTimerSeconds('')).toBeNull();
    });

    it('returns null for values that cannot be a countdown', () => {
      expect(normalizePauseTimerSeconds(0)).toBeNull();
      expect(normalizePauseTimerSeconds(-5)).toBeNull();
      expect(normalizePauseTimerSeconds('abc')).toBeNull();
      expect(normalizePauseTimerSeconds(Number.NaN)).toBeNull();
    });

    it('accepts positive values as whole seconds', () => {
      expect(normalizePauseTimerSeconds(30)).toBe(30);
      expect(normalizePauseTimerSeconds('45')).toBe(45);
      expect(normalizePauseTimerSeconds(10.9)).toBe(10);
    });
  });

  describe('formatPauseCountdown', () => {
    it('formats remaining seconds as m:ss', () => {
      expect(formatPauseCountdown(0)).toBe('0:00');
      expect(formatPauseCountdown(5)).toBe('0:05');
      expect(formatPauseCountdown(47)).toBe('0:47');
      expect(formatPauseCountdown(65)).toBe('1:05');
      expect(formatPauseCountdown(600)).toBe('10:00');
    });
  });

  describe('observePauseTimerSeconds', () => {
    // The Config tab persists through TelemetryTableConfiguration, which
    // mutates the whole 'configuration' object; core only emits events for
    // the mutated path and its parents, never child paths. Observing the
    // child path 'configuration.pauseTimerSeconds' therefore never fires.
    it('observes the parent configuration path and extracts the timer', () => {
      let observedPath;
      let observerCallback;
      const openmct = {
        objects: {
          observe: (domainObject, path, callback) => {
            observedPath = path;
            observerCallback = callback;

            return () => {};
          }
        }
      };
      const onChange = jasmine.createSpy('onChange');
      const domainObject = { configuration: { pauseTimerSeconds: 10 } };

      observePauseTimerSeconds(openmct, domainObject, onChange);

      expect(observedPath).toBe('configuration');

      observerCallback({ pauseTimerSeconds: 25 });
      expect(onChange).toHaveBeenCalledWith(25);

      observerCallback({ pauseTimerSeconds: null });
      expect(onChange).toHaveBeenCalledWith(null);
    });

    it('ignores configuration changes that leave the timer unchanged', () => {
      let observerCallback;
      const openmct = {
        objects: {
          observe: (domainObject, path, callback) => {
            observerCallback = callback;

            return () => {};
          }
        }
      };
      const onChange = jasmine.createSpy('onChange');
      const domainObject = { configuration: { pauseTimerSeconds: 10 } };

      observePauseTimerSeconds(openmct, domainObject, onChange);

      // e.g. toggling a column mutates 'configuration' with the same timer
      observerCallback({ pauseTimerSeconds: 10, hiddenColumns: { scet: true } });
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('createEvrPauseCountdown', () => {
    let onTick;
    let onExpire;
    let countdown;

    beforeEach(() => {
      onTick = jasmine.createSpy('onTick');
      onExpire = jasmine.createSpy('onExpire');
      countdown = createEvrPauseCountdown({ onTick, onExpire });
    });

    afterEach(() => {
      countdown.destroy();
    });

    it('ticks once per second and expires at zero', () => {
      countdown.start(3);

      expect(onTick).toHaveBeenCalledWith(3);

      jasmine.clock().tick(1000);
      expect(onTick).toHaveBeenCalledWith(2);

      jasmine.clock().tick(1000);
      expect(onTick).toHaveBeenCalledWith(1);

      jasmine.clock().tick(1000);
      expect(onExpire).toHaveBeenCalledTimes(1);
      expect(countdown.isRunning()).toBe(false);
    });

    it('does not start for an unusable setting', () => {
      expect(countdown.start(0)).toBe(false);
      expect(countdown.start(null)).toBe(false);

      jasmine.clock().tick(5000);

      expect(onTick).not.toHaveBeenCalled();
      expect(onExpire).not.toHaveBeenCalled();
    });

    it('resets to the configured value on demand', () => {
      countdown.start(10);
      jasmine.clock().tick(4000);
      countdown.reset();

      expect(onTick).toHaveBeenCalledWith(10);

      jasmine.clock().tick(9999);
      expect(onExpire).not.toHaveBeenCalled();

      jasmine.clock().tick(1);
      expect(onExpire).toHaveBeenCalledTimes(1);
    });

    it('dismisses without expiring', () => {
      countdown.start(5);
      jasmine.clock().tick(2000);
      countdown.dismiss();

      expect(countdown.isRunning()).toBe(false);

      jasmine.clock().tick(10000);
      expect(onExpire).not.toHaveBeenCalled();
    });

    it('stops ticking after destroy', () => {
      countdown.start(5);
      countdown.destroy();

      jasmine.clock().tick(10000);

      expect(onTick).toHaveBeenCalledTimes(1);
      expect(onExpire).not.toHaveBeenCalled();
    });
  });
});
