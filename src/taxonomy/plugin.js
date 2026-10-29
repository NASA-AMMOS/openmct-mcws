import DatasetCache from 'services/dataset/DatasetCache.js';
import DatasetCompositionProvider from './DatasetCompositionProvider.js';
import TaxonomyCompositionProvider from './TaxonomyCompositionProvider.js';
import TaxonomyObjectProvider from './TaxonomyObjectProvider.js';
import ChannelAlarmPlugin from './ChannelAlarmPlugin.js';
import EVRHighlightProvider from './EVRHighlightProvider.js';
import FrameEventFilterObjectProvider from './FrameEventFilterObjectProvider.js';

// Columns follow these domains, not time-system registration: every field
// the server sends should be displayable even when its time system is not
// configured. Each entry carries its own fallback format for exactly that
// case; every one of these formats is registered unconditionally by the
// formats plugin. Only the time domains are always on; MSL Sol and LMST
// are appended when their time systems are registered (see below).
// TODO: re-work this list in the future (additional domains, ordering).
const TIMESYSTEM_DOMAIN_MAP = {
  scet: {
    key: 'scet',
    name: 'SCET',
    format: 'utc.day-of-year'
  },
  ert: {
    key: 'ert',
    name: 'ERT',
    format: 'utc.day-of-year'
  },
  sclk: {
    key: 'sclk',
    name: 'SCLK as Float 64',
    format: 'sclk.float64'
  }
};

// Registration-gated extras: appended to the always-on domains above only
// when the matching time system is registered.
const REGISTERED_ONLY_DOMAIN_MAP = {
  'msl.sol': {
    key: 'msl.sol',
    name: 'MSL Sol',
    source: 'lst',
    format: 'msl.sol'
  },
  lmst: {
    key: 'lmst',
    name: 'LMST',
    source: 'lst',
    format: 'lmst'
  }
};

function TaxonomyPlugin(options) {
  return function install(openmct) {
    const datasets = DatasetCache();
    const registeredTimeSystems = new Map(
      openmct.time.getAllTimeSystems().map((timeSystem) => [timeSystem.key, timeSystem])
    );
    const domainKeys = [
      ...Object.keys(TIMESYSTEM_DOMAIN_MAP),
      ...Object.keys(REGISTERED_ONLY_DOMAIN_MAP).filter(
        (key) => key !== 'utc' && registeredTimeSystems.has(key)
      )
    ];
    const domains = domainKeys.map((key, index) => {
      const map = TIMESYSTEM_DOMAIN_MAP[key] ?? REGISTERED_ONLY_DOMAIN_MAP[key];
      const registeredTimeSystem = registeredTimeSystems.get(key);

      return {
        ...map,
        format: registeredTimeSystem?.timeFormat ?? map.format,
        hints: {
          domain: index
        }
      };
    });

    openmct.objects.addProvider('vista', new TaxonomyObjectProvider(datasets, domains));
    openmct.composition.addProvider(new DatasetCompositionProvider(datasets));
    openmct.composition.addProvider(new TaxonomyCompositionProvider(datasets));
    openmct.install(new ChannelAlarmPlugin(domains, datasets));
    openmct.objects.addProvider(
      'vista-frame-event-filter',
      new FrameEventFilterObjectProvider(datasets)
    );
    openmct.telemetry.addProvider(new EVRHighlightProvider(options));
  };
}

export default TaxonomyPlugin;
