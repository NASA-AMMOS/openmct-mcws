import TimePlugin from './plugin.js';
import {
  evaluateTimeExpression,
  resolveEagerMarkers,
  reviveDynamicMarkers
} from './dynamicPresets.js';

describe('evaluateTimeExpression', () => {
  it('resolves offsets to milliseconds', () => {
    expect(evaluateTimeExpression('-${thirty_minutes}')).toBe(-1800000);
    expect(evaluateTimeExpression('${thirty_seconds}')).toBe(30000);
    expect(evaluateTimeExpression('-${one_hour}')).toBe(-3600000);
  });

  it('resolves now-relative expressions around the current time', () => {
    const before = Date.now();
    const value = evaluateTimeExpression('${now} - ${two_hours}');
    const after = Date.now();

    expect(value).toBeGreaterThanOrEqual(before - 2 * 3600000);
    expect(value).toBeLessThanOrEqual(after - 2 * 3600000);
  });

  it('returns undefined for invalid expressions', () => {
    expect(evaluateTimeExpression('not a time')).toBeUndefined();
  });

  it('resolves eight hours to milliseconds', () => {
    expect(evaluateTimeExpression('${eight_hours}')).toBe(28800000);
  });

  it('resolves UTC-calendar day anchors', () => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    expect(evaluateTimeExpression('${dayStart:0}')).toBe(today.getTime());
    expect(evaluateTimeExpression('${dayStart:1}') - evaluateTimeExpression('${dayStart:0}')).toBe(
      86400000
    );
    expect(evaluateTimeExpression('${dayStart:-7}')).toBe(today.getTime() - 7 * 86400000);
  });

  it('resolves UTC-calendar month and year anchors', () => {
    const now = new Date();
    const monthStart = evaluateTimeExpression('${monthStart:0}');
    const yearStart = evaluateTimeExpression('${yearStart:0}');

    expect(new Date(monthStart).getUTCDate()).toBe(1);
    expect(new Date(monthStart).getUTCMonth()).toBe(now.getUTCMonth());
    expect(new Date(yearStart).getUTCMonth()).toBe(0);
    expect(new Date(yearStart).getUTCDate()).toBe(1);
    expect(new Date(evaluateTimeExpression('${monthStart:-1}')).getUTCDate()).toBe(1);
    expect(evaluateTimeExpression('${yearStart:-1}')).toBe(
      Date.UTC(now.getUTCFullYear() - 1, 0, 1)
    );
  });
});

describe('reviveDynamicMarkers', () => {
  it('revives whole-string markers to re-evaluated closures', () => {
    const revived = reviveDynamicMarkers({
      start: '${dynamic:${now} - ${two_hours}}'
    });

    expect(typeof revived.start).toBe('function');

    const frozenNow = 1790000000000;
    const realNow = Date.now;
    Date.now = () => frozenNow;
    const first = revived.start();
    Date.now = () => frozenNow + 60000;
    const second = revived.start();
    Date.now = realNow;

    expect(first).toBe(frozenNow - 2 * 3600000);
    expect(second).toBe(frozenNow + 60000 - 2 * 3600000);
  });

  it('revives markers nested in arrays and objects', () => {
    const revived = reviveDynamicMarkers({
      presets: [{ bounds: { start: '${dynamic:-${one_hour}}', end: 5 } }]
    });

    expect(typeof revived.presets[0].bounds.start).toBe('function');
    expect(revived.presets[0].bounds.start()).toBe(-3600000);
    expect(revived.presets[0].bounds.end).toBe(5);
  });

  it('leaves non-markers, partial embeddings, and functions untouched', () => {
    const fn = () => 42;
    const revived = reviveDynamicMarkers({
      plain: 'hello',
      partial: 'prefix ${dynamic:${now}} suffix',
      eager: '${now}',
      fn,
      num: 7,
      nil: null
    });

    expect(revived.plain).toBe('hello');
    expect(revived.partial).toBe('prefix ${dynamic:${now}} suffix');
    expect(revived.eager).toBe('${now}');
    expect(revived.fn).toBe(fn);
    expect(revived.num).toBe(7);
    expect(revived.nil).toBe(null);
  });

  it('does not mutate its input', () => {
    const input = { start: '${dynamic:${now}}' };
    reviveDynamicMarkers(input);

    expect(input).toEqual({ start: '${dynamic:${now}}' });
  });
});

describe('TimePlugin advanced timeSystems', () => {
  let openmct;
  let conductorConfig;

  function installWithTime(time) {
    openmct = {
      time: {
        addTimeSystem: jasmine.createSpy('addTimeSystem'),
        addClock: jasmine.createSpy('addClock'),
        setBounds: jasmine.createSpy('setBounds')
      },
      install: jasmine.createSpy('install'),
      plugins: {
        Conductor: jasmine.createSpy('Conductor').and.callFake((config) => {
          conductorConfig = config;

          return () => {};
        })
      }
    };
    conductorConfig = undefined;
    TimePlugin(time)(openmct);

    return conductorConfig;
  }

  it('registers the configured time systems and clocks', () => {
    installWithTime({
      defaultMode: 'fixed',
      utcFormat: 'utc.day-of-year',
      timeSystems: ['scet', 'ert'],
      allowRealtime: true,
      allowLAD: true,
      records: 10
    });

    expect(openmct.time.addTimeSystem).toHaveBeenCalledTimes(2);
    // utc.local clock plus one LAD clock per system.
    expect(openmct.time.addClock).toHaveBeenCalledTimes(3);
  });

  it('puts the default mode first and propagates records', () => {
    const config = installWithTime({
      defaultMode: 'fixed',
      utcFormat: 'utc.day-of-year',
      timeSystems: ['scet', 'ert'],
      allowRealtime: true,
      allowLAD: true,
      records: 10
    });
    const [first] = config.menuOptions;

    expect(first.clock).toBeUndefined();
    expect(first.timeSystem).toBe('scet');
    expect(first.records).toBe(10);
  });

  it('applies per-system limits and modeSettings', () => {
    const config = installWithTime({
      utcFormat: 'utc.day-of-year',
      timeSystems: [
        {
          key: 'scet',
          limit: 3600000,
          modeSettings: {
            realtime: {
              clockOffsets: { start: -1000, end: 1000 },
              presets: [{ label: 'Custom', bounds: { start: -1000, end: 1000 } }]
            }
          }
        }
      ],
      allowRealtime: true,
      allowLAD: false
    });
    const fixed = config.menuOptions.find((option) => !option.clock);
    const realtime = config.menuOptions.find((option) => option.clock === 'utc.local');

    expect(fixed.limit).toBe(3600000);
    expect(realtime.clockOffsets).toEqual({ start: -1000, end: 1000 });
    expect(realtime.presets).toEqual([{ label: 'Custom', bounds: { start: -1000, end: 1000 } }]);
  });

  it('revives dynamic preset bounds to closures', () => {
    const config = installWithTime({
      utcFormat: 'utc.day-of-year',
      timeSystems: [
        {
          key: 'ert',
          modeSettings: {
            fixed: {
              presets: [
                {
                  label: 'Last 2 hours',
                  bounds: {
                    start: '${dynamic:${now} - ${two_hours}}',
                    end: '${dynamic:${now}}'
                  }
                }
              ]
            }
          }
        }
      ],
      allowRealtime: false,
      allowLAD: false
    });
    const [preset] = config.menuOptions[0].presets;

    expect(typeof preset.bounds.start).toBe('function');
    expect(typeof preset.bounds.end).toBe('function');
    expect(preset.bounds.end()).toBeLessThanOrEqual(Date.now());
    expect(preset.bounds.end() - preset.bounds.start()).toBe(2 * 3600000);
  });

  it('leaves marker strings intact in the source config', () => {
    const time = {
      utcFormat: 'utc.day-of-year',
      timeSystems: [
        {
          key: 'ert',
          modeSettings: {
            fixed: {
              presets: [
                {
                  label: 'Last 2 hours',
                  bounds: { start: '${dynamic:${now} - ${two_hours}}', end: '${dynamic:${now}}' }
                }
              ]
            }
          }
        }
      ],
      allowRealtime: false,
      allowLAD: false
    };

    installWithTime(time);

    expect(time.timeSystems[0].modeSettings.fixed.presets[0].bounds.start).toBe(
      '${dynamic:${now} - ${two_hours}}'
    );
  });

  it('resolves menu-level marker strings to numbers immediately', () => {
    const resolved = resolveEagerMarkers({
      start: '${dynamic:${dayStart:0} - 86400000}',
      end: '${dynamic:${dayStart:0} + 86399999}'
    });

    expect(resolved.start % 86400000).toBe(0);
    expect(resolved.end % 86400000).toBe(86399999);
    expect(resolved.end - resolved.start).toBeGreaterThan(0);
    expect(resolved.end - resolved.start).toBeLessThan(3 * 86400000);
    expect(Date.now() - resolved.start).toBeLessThan(2 * 86400000);
  });

  it('calls revived closures once for menu-level scalars', () => {
    let calls = 0;
    const resolved = resolveEagerMarkers({
      start: () => {
        calls += 1;

        return 100;
      },
      end: 200
    });

    expect(resolved).toEqual({ start: 100, end: 200 });
    expect(calls).toBe(1);
  });

  it('passes plain menu numbers through untouched', () => {
    expect(resolveEagerMarkers({ start: -1800000, end: 60000 })).toEqual({
      start: -1800000,
      end: 60000
    });
  });

  it('re-applies explicit fixed bounds after the conductor install', () => {
    installWithTime({
      defaultMode: 'fixed',
      utcFormat: 'utc.day-of-year',
      timeSystems: [
        {
          key: 'scet',
          modeSettings: {
            fixed: {
              bounds: {
                start: '${dynamic:${dayStart:0} - 86400000}',
                end: '${dynamic:${dayStart:0} + 86399999}'
              }
            }
          }
        },
        'ert'
      ],
      allowRealtime: true,
      allowLAD: true,
      records: 10
    });

    expect(openmct.time.setBounds).toHaveBeenCalledTimes(1);
    const applied = openmct.time.setBounds.calls.argsFor(0)[0];
    expect(applied.start % 86400000).toBe(0);
    expect(applied.end % 86400000).toBe(86399999);
    expect(applied.end - applied.start).toBeGreaterThan(0);
    expect(applied.end - applied.start).toBeLessThan(3 * 86400000);
  });

  it('leaves boot bounds alone without explicit fixed bounds', () => {
    installWithTime({
      defaultMode: 'fixed',
      utcFormat: 'utc.day-of-year',
      timeSystems: ['scet', 'ert'],
      allowRealtime: true,
      allowLAD: true,
      records: 10
    });

    expect(openmct.time.setBounds).not.toHaveBeenCalled();
  });
});
