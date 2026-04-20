import DatasetCache from 'services/dataset/DatasetCache.js';
import DatasetCompositionProvider from './DatasetCompositionProvider.js';
import TaxonomyCompositionProvider from './TaxonomyCompositionProvider.js';
import TaxonomyObjectProvider from './TaxonomyObjectProvider.js';
import ChannelAlarmPlugin from './ChannelAlarmPlugin.js';
import EVRHighlightProvider from './EVRHighlightProvider.js';
import FrameEventFilterObjectProvider from './FrameEventFilterObjectProvider.js';

const TIMESYSTEM_DOMAIN_MAP = {
  'msl.sol': {
    key: 'msl.sol',
    name: 'MSL Sol',
    source: 'lst'
  },
  lmst: {
    key: 'lmst',
    name: 'LMST',
    source: 'lst'
  },
  scet: {
    key: 'scet',
    name: 'SCET'
  },
  ert: {
    key: 'ert',
    name: 'ERT'
  },
  sclk: {
    key: 'sclk',
    name: 'SCLK as Float 64'
  }
};

function TaxonomyPlugin(options) {
  return function install(openmct) {
    const datasets = DatasetCache();
    const utcTimeSystems = openmct.time.getAllTimeSystems().filter((ts) => ts.key !== 'utc');
    const domains = utcTimeSystems.map((timeSystem, i) => {
      const domain = TIMESYSTEM_DOMAIN_MAP[timeSystem.key];
      domain.format = timeSystem.timeFormat;
      domain.hints = {
        domain: i
      };

      return domain;
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
