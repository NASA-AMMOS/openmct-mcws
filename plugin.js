import AboutTemplate from './about.html';
import VistaStyles from './src/styles/sass/vista.scss'; /** Do not delete, needed for webpack to compile scss file*/
import CommandEventsViewPlugin from './src/commandEventsView/plugin.js';
import TaxonomyPlugin from './src/taxonomy/plugin.js';
import HistoricalTelemetryPlugin from './src/historical/plugin.js';
import LinkPlugin from './src/link/plugin.js';
import FormatPlugin from './src/formats/plugin.js';
import MessagesPlugin from './src/messagesView/plugin.js';
import ProductStatusPlugin from './src/product-status/plugin.js';
import MetadataActionPlugin from './src/metadataAction/plugin.js';
import ClearDataIndicatorPlugin from './src/clearDataIndicator/plugin.js';
import DictionaryViewPlugin from './src/dictionaryView/plugin.js';
import PacketSummaryPlugin from './src/packetSummary/plugin.js';
import ContainerViewPlugin from './src/containerView/plugin.js';
import IdentityProvider from './src/services/identity/MCWSIdentityProvider.js';
import MCWSPersistenceProviderPlugin from './src/persistence/plugin.js';
import DatasetCache from './src/services/dataset/DatasetCache.js';
import SessionService from './src/services/session/SessionService.js';
import GlobalStaleness from './src/services/globalStaleness/globalStaleness.js';
import TypePlugin from './src/types/plugin.js';
import TimePlugin from './src/time/plugin.js';
import getVistaTime from './src/services/time/vistaTime.js';
import RealtimeTelemetryPlugin from './src/realtime/plugin.js';
import VenuePlugin from './src/venues/plugin.js';
import mcwsClient from './src/services/mcws/MCWSClient.js';
import UTCDayOfYearFormat from './src/formats/UTCDayOfYearFormat.js';
import FrameWatchViewPlugin from './src/frameSummary/plugin.js';
import FrameEventFilterViewPlugin from './src/frameEventFilterView/plugin.js';
import ChannelTablePlugin from './src/channelTable/channelTablePlugin/plugin.js';
import ChannelTableSetPlugin from './src/channelTable/channelTableSetPlugin/plugin.js';
import ChannelLimitsPlugin from './src/channelLimits/plugin.js';
import FrameAccountabilityPlugin from './src/frameAccountability/plugin.js';
import AlarmsViewPlugin from './src/alarmsView/plugin.js';
import EVRViewPlugin from './src/evrView/plugin.js';
import CustomFormatterPlugin from './src/customFormatter/plugin.js';
import CustomFormsPlugin from './src/customForms/plugin.js';
import ActionModifiersPlugin from './src/actionModifiers/plugin.js';
import RealtimeIndicatorPlugin from './src/realtimeIndicator/plugin.js';
import PacketQueryPlugin from './src/packetQuery/plugin.js';
import MCWSIndicatorPlugin from './src/mcwsIndicator/plugin.js';
import MultipleHistoricalSessions from './src/multipleHistoricalSessions/plugin.js';
import RealtimeSessions from './src/realtimeSessions/plugin.js';
import GlobalFilters from './src/globalFilters/plugin.js';
import ExportDataAction from './src/exportDataAction/plugin.js';

export default function openmctMCWSPlugin(options) {
  return function install(openmct) {
    const defaultConfig = {
      venueAware: {
        enabled: false,
        venues: 'ExampleVenueDefinitions.json'
      },
      taxonomy: {
        evrDefaultBackgroundColor: undefined,
        evrDefaultForegroundColor: undefined,
        evrBackgroundColorByLevel: {
          FATAL: '#ff0000',
          WARNING_HI: '#ff7f24',
          WARNING_LO: '#ffff00',
          COMMAND: '#00bfff',
          ACTIVITY_HI: '#6d6d6d',
          ACTIVITY_LO: '#dcdcdc',
          DIAGNOSTIC: '#00ff00',
          EVR_UNKNOWN: '#00ff00',
          FAULT: '#ff0000',
          WARNING: '#ff7f24'
        },
        evrForegroundColorByLevel: {
          FATAL: '#ffffff',
          WARNING_HI: '#000000',
          WARNING_LO: '#000000',
          COMMAND: '#ffffff',
          ACTIVITY_HI: '#ffffff',
          ACTIVITY_LO: '#000000',
          DIAGNOSTIC: '#000000',
          EVR_UNKNOWN: '#000000',
          FAULT: '#ffffff',
          WARNING: '#000000'
        }
      },
      time: {
        defaultMode: 'fixed',
        utcFormat: 'utc.day-of-year',
        lmstEpoch: Date.UTC(2020, 2, 18, 0, 0, 0),
        subscriptionMCWSFilterDelay: 100,
        timeSystems: ['scet', 'ert'],
        allowRealtime: true,
        allowLAD: true,
        records: 10
      },
      sessionHistoricalMaxResults: 100,
      batchHistoricalChannelQueries: false,
      disableSortParam: false,
      messageStreamUrl: '',
      messageTypeFilters: [],
      frameAccountabilityExpectedVcidList: [],
      queryTimespanLimit: undefined,
      globalStalenessInterval: undefined,
      customFormatters: [],
      sessions: {
        historicalSessionFilter: {
          disable: false,
          maxRecords: 100,
          denyUnfilteredQueries: false
        },
        realtimeSession: {
          disable: false
        }
      },
      tablePerformanceOptions: {
        telemetryMode: 'unlimited',
        persistModeChange: false,
        rowLimit: 50
      },
      assetPath: 'node_modules/openmct/dist',
      mcwsPluginAssetPath: 'node_modules/openmct-mcws-plugin/dist'
    };

    // Deep merge function
    function deepMerge(target, source) {
      const output = Object.assign({}, target);

      if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach((key) => {
          if (isObject(source[key])) {
            if (!(key in target)) {
              Object.assign(output, { [key]: source[key] });
            } else {
              output[key] = deepMerge(target[key], source[key]);
            }
          } else {
            Object.assign(output, { [key]: source[key] });
          }
        });
      }

      return output;
    }

    function isObject(item) {
      return item && typeof item === 'object' && !Array.isArray(item);
    }

    const config = deepMerge(defaultConfig, options || {});

    openmct.setAssetPath(config.assetPath);
    openmct.install(ClearDataIndicatorPlugin(config.globalStalenessInterval));
    openmct.install(CommandEventsViewPlugin(config.tablePerformanceOptions));
    openmct.install(MessagesPlugin(config.tablePerformanceOptions));
    openmct.install(ProductStatusPlugin(config.tablePerformanceOptions));
    openmct.install(MetadataActionPlugin());
    openmct.install(DictionaryViewPlugin(config.tablePerformanceOptions));
    openmct.install(PacketSummaryPlugin(config.tablePerformanceOptions));
    openmct.install(ContainerViewPlugin());

    // initialize session service, datasetCache service, global staleness
    SessionService(openmct, config);
    DatasetCache(openmct);
    GlobalStaleness(openmct, config.globalStalenessInterval);

    openmct.install(new FormatPlugin(config));

    const timePlugin = new TimePlugin(config.time);

    openmct.install(timePlugin);

    const formatKey = config.time.utcFormat;
    const utcFormat = formatKey
      ? openmct.telemetry.getFormatter(formatKey)
      : new UTCDayOfYearFormat();
    const vistaTime = getVistaTime({
      options: timePlugin,
      format: utcFormat
    });
    openmct.install(RealtimeIndicatorPlugin(vistaTime, utcFormat));

    mcwsClient.configure(config);

    openmct.install(MultipleHistoricalSessions(config.tablePerformanceOptions));
    openmct.install(RealtimeSessions());
    openmct.install(new HistoricalTelemetryPlugin(config));
    openmct.install(new RealtimeTelemetryPlugin(vistaTime, config));
    openmct.install(new TypePlugin());
    openmct.install(new TaxonomyPlugin(config.taxonomy));
    openmct.install(new LinkPlugin(config));
    openmct.install(new VenuePlugin(config));
    openmct.install(FrameWatchViewPlugin(config.tablePerformanceOptions));
    openmct.install(FrameEventFilterViewPlugin(config.tablePerformanceOptions));
    openmct.install(new ChannelTablePlugin(config.tablePerformanceOptions));
    openmct.install(new ChannelTableSetPlugin());
    openmct.install(new ChannelLimitsPlugin());
    openmct.install(new FrameAccountabilityPlugin(config));
    openmct.install(EVRViewPlugin(config));
    openmct.install(new AlarmsViewPlugin(config.tablePerformanceOptions));
    openmct.install(MCWSIndicatorPlugin());

    if (config.messageStreamUrl && config.messageStreamUrl !== '') {
      openmct.install(
        new MessageStreamProcessor(config.messageStreamUrl, {
          clearData: ['StartOfSession', 'EndOfSession'],
          suspectChannels: ['SuspectChannels']
        })
      );
    }

    if (config.customFormatters.length) {
      openmct.install(CustomFormatterPlugin(config.customFormatters));
    }

    openmct.install(CustomFormsPlugin());
    openmct.install(
      new ExportDataAction([
        'table',
        'telemetry.plot.overlay',
        'telemetry.plot.stacked',
        'vista.channel',
        'vista.channelGroup',
        'vista.chanTableGroup',
        'vista.evr',
        'vista.evrModule',
        'vista.evrSource',
        'vista.evrView'
      ])
    );
    openmct.install(ActionModifiersPlugin());
    openmct.install(new PacketQueryPlugin());

    if (config.globalFilters) {
      openmct.install(new GlobalFilters(config.globalFilters));
    }

    openmct.user.setProvider(new IdentityProvider(openmct));

    openmct.install(MCWSPersistenceProviderPlugin(config.namespaces));

    openmct.branding({ aboutHtml: insertBuildInfo(AboutTemplate) });

    // do not show telemetry if it falls out of bounds
    // even if there is no new telemetry
    openmct.telemetry.greedyLAD(false);

    // expose the config to the window
    window.openmctMCWSConfig = config;

    // load the css file
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${config.mcwsPluginAssetPath}/openmct-mcws-plugin.css`;
    document.head.appendChild(link);
  };

  /**
   * Replaces placeholders in the HTML with build info provided by webpack.
   * Build info is defined in webpack config, and is exposed as global
   * JavaScript variables
   * @param {*} markup
   */
  function insertBuildInfo(markup) {
    return markup
      .replace(/\$\{project\.version\}/g, __OMM_VERSION__)
      .replace(/\$\{timestamp\}/g, __OMM_BUILD_DATE__)
      .replace(/\$\{buildNumber\}/g, __OMM_REVISION__)
      .replace(/\$\{branch\}/g, __OMM_BUILD_BRANCH__);
  }
}
