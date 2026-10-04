import ERTTimeSystem from './ERTTimeSystem.js';
import SCETTimeSystem from './SCETTimeSystem.js';
import SCLKTimeSystem from './SCLKTimeSystem.js';
import MSLSolTimeSystem from './MSLSolTimeSystem.js';
import LMSTTimeSystem from './LMSTTimeSystem.js';
import UTCClock from './UTCClock.js';
import LADClock from './LADClock.js';
import MSLSolFormat from '../formats/MSLSOLFormat.js';
import LMSTFormat from '../formats/LMSTFormat.js';
import { resolveEagerMarkers, reviveDynamicMarkers } from './dynamicPresets.js';
import moment from 'moment';

const SYSTEM_MAP = {
  ert: ERTTimeSystem,
  scet: SCETTimeSystem,
  sclk: SCLKTimeSystem,
  'msl.sol': MSLSolTimeSystem,
  lmst: LMSTTimeSystem
};

export default function TimePlugin(options) {
  return function install(openmct) {
    const TODAY_BOUNDS = {
      start: moment.utc().startOf('day').valueOf(),
      end: moment.utc().endOf('day').valueOf()
    };
    const solFormat = new MSLSolFormat(openmct);
    const lmstFormat = new LMSTFormat(openmct);
    const nowLST = solFormat.format(moment.utc());
    const sol = Number(/SOL-(\d+)M/.exec(nowLST)[1]);
    const BOUNDS_MAP = {
      ert: TODAY_BOUNDS,
      scet: TODAY_BOUNDS,
      sclk: {
        start: 1,
        end: 10000
      },
      'msl.sol': {
        start: solFormat.parse('SOL-' + sol),
        end: solFormat.parse('SOL-' + (sol + 1))
      },
      lmst: {
        start: lmstFormat.parse('SOL-' + sol),
        end: lmstFormat.parse('SOL-' + (sol + 1))
      }
    };

    if (!options.timeSystems) {
      console.error('Please specify one or more time systems to enable.');
    }

    // Revive dynamic markers on a copy. The merged config object is shared
    // (and exposed for debugging), so marker strings must survive there while
    // menus receive live closures.
    const timeSystems = options.timeSystems
      ? reviveDynamicMarkers(options.timeSystems)
      : options.timeSystems;

    if (options.lmstEpoch) {
      const lmstFormatWithEpoch = new LMSTFormat(options.lmstEpoch);

      BOUNDS_MAP.lmst = {
        start: lmstFormatWithEpoch.parse('SOL-' + sol),
        end: lmstFormatWithEpoch.parse('SOL-' + (sol + 1))
      };
    }

    install.ladClocks = {};
    install.timeSystems = options.timeSystems;

    let useUTCClock = false;
    let menuOptions = [];

    timeSystems.forEach(function (timeSystem) {
      const key = timeSystem.key ?? timeSystem;

      if (!SYSTEM_MAP[key]) {
        console.error('Invalid timeSystem specified: ' + key);

        return;
      }

      const system = new SYSTEM_MAP[key](options.utcFormat);
      const systemOptions = {
        timeSystem: system.key,
        name: 'fixed'
      };

      openmct.time.addTimeSystem(system);

      if (timeSystem.modeSettings?.fixed?.bounds) {
        systemOptions.bounds = resolveEagerMarkers(timeSystem.modeSettings.fixed.bounds);
      } else {
        systemOptions.bounds = BOUNDS_MAP[key];
      }

      if (timeSystem.modeSettings?.fixed?.presets) {
        systemOptions.presets = timeSystem.modeSettings.fixed.presets;
      }

      if (timeSystem.limit) {
        systemOptions.limit = timeSystem.limit;
      }

      if (options.records) {
        systemOptions.records = options.records;
      }

      menuOptions.push(systemOptions);

      const DEFAULT_OFFSET_CONFIG = {
        start: -30 * 60 * 1000,
        end: 5 * 60 * 1000
      };

      if (options.allowRealtime && system.isUTCBased) {
        let offsetConfig = DEFAULT_OFFSET_CONFIG;
        let presetConfig = [];

        if (timeSystem.modeSettings?.realtime?.clockOffsets) {
          offsetConfig = resolveEagerMarkers(timeSystem.modeSettings.realtime.clockOffsets);
        }

        if (timeSystem.modeSettings?.realtime?.presets) {
          presetConfig = timeSystem.modeSettings.realtime.presets;
        }

        useUTCClock = true;
        menuOptions.push({
          name: 'realtime',
          timeSystem: system.key,
          clock: 'utc.local',
          clockOffsets: offsetConfig,
          presets: presetConfig
        });
      }

      if (options.allowRealtime && options.allowLAD) {
        const ladClock = new LADClock(key);
        let offsetConfig = DEFAULT_OFFSET_CONFIG;

        if (timeSystem.modeSettings?.lad?.clockOffsets) {
          offsetConfig = resolveEagerMarkers(timeSystem.modeSettings.lad.clockOffsets);
        }

        install.ladClocks[key] = ladClock;
        openmct.time.addClock(ladClock);
        menuOptions.push({
          timeSystem: system.key,
          clock: ladClock.key,
          clockOffsets: offsetConfig
        });
      }
    });

    if (options.defaultMode) {
      const isFixedMode = options.defaultMode === 'fixed';
      const matchingConfigIndex = menuOptions.findIndex((menuOption) =>
        isFixedMode ? !menuOption.clock : menuOption.clock === options.defaultMode
      );

      if (matchingConfigIndex !== -1) {
        const matchingConfig = menuOptions[matchingConfigIndex];

        menuOptions.splice(matchingConfigIndex, 1);
        menuOptions.unshift(matchingConfig);
      } else {
        console.warn(
          `Default mode '${options.defaultMode}' specified in configuration could not be applied. Are LAD or realtime enabled? Does the defaultMode contain a typo?`
        );
      }
    }

    if (useUTCClock) {
      openmct.time.addClock(new UTCClock());
    }

    openmct.install(
      openmct.plugins.Conductor({
        menuOptions: menuOptions
      })
    );

    // Core's conductor install reapplies the active clock's offsets in fixed
    // mode, and core's setClockOffsets always re-derives bounds from the
    // clock tick, so the default menu's bounds never survive the install.
    // Re-apply explicitly configured fixed bounds so a fixed boot shows them.
    // (Defaults without explicit bounds keep today's tick-derived behavior.)
    const defaultMenu = menuOptions[0];
    const defaultSystem = timeSystems.find(
      (timeSystem) => (timeSystem.key ?? timeSystem) === defaultMenu?.timeSystem
    );

    if (defaultMenu && !defaultMenu.clock && defaultSystem?.modeSettings?.fixed?.bounds) {
      openmct.time.setBounds(defaultMenu.bounds);
    }
  };
}
