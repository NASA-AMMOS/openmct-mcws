define([
  'services/dataset/DatasetCache',
  'services/session/SessionService',
  'services/globalStaleness/globalStaleness',
  './types/plugin',
  './taxonomy/plugin',
  './time/plugin',
  'services/time/vistaTime',
  './historical/plugin',
  './realtime/plugin',
  './link/plugin',
  './formats/plugin',
  './venues/plugin',
  'services/mcws/MCWSClient',
  './formats/UTCDayOfYearFormat',
  './framesummary/plugin',
  './frameEventFilterView/plugin',
  './channelTable/channelTablePlugin/plugin',
  './channelTable/channelTableSetPlugin/plugin',
  './channelLimits/plugin',
  './frameaccountability/plugin',
  './alarmsView/plugin',
  './messageStreamProcessor/plugin',
  './evrView/plugin',
  './customFormatter/plugin',
  './customForms/plugin',
  './actionModifiers/plugin',
  './realtimeIndicator/plugin',
  './packetQuery/plugin',
  './mcwsIndicator/plugin',
  './multipleHistoricalSessions/plugin',
  './realtimeSessions/plugin',
  './globalFilters/plugin',
  './exportDataAction/plugin'
], function (
  DatasetCache,
  SessionService,
  GlobalStaleness,
  TypePlugin,
  TaxonomyPlugin,
  TimePlugin,
  getVistaTime,
  HistoricalTelemetryPlugin,
  RealtimeTelemetryPlugin,
  LinkPlugin,
  FormatPlugin,
  VenuePlugin,
  mcwsClient,
  UTCDayOfYearFormat,
  FrameWatchViewPlugin,
  FrameEventFilterViewPlugin,
  ChannelTablePlugin,
  ChannelTableSetPlugin,
  ChannelLimitsPlugin,
  FrameAccountabilityPlugin,
  AlarmsViewPlugin,
  MessageStreamProcessor,
  EVRViewPlugin,
  CustomFormatterPlugin,
  CustomFormsPlugin,
  ActionModifiersPlugin,
  RealtimeIndicatorPlugin,
  PacketQueryPlugin,
  MCWSIndicatorPlugin,
  MultipleHistoricalSessions,
  RealtimeSessions,
  GlobalFilters,
  ExportDataAction
) {
  function AMMOSPlugins(options) {
    return function install(openmct) {
      // initialze session service, datasetCache service, global staleness
      SessionService.default(openmct, options);
      DatasetCache.default(openmct);
      GlobalStaleness.default(openmct, options.globalStalenessInterval);

      openmct.install(new FormatPlugin(options));

      const timePlugin = new TimePlugin.default(options.time);
      openmct.install(timePlugin);

      const formatKey = options.time.utcFormat;
      const utcFormat = formatKey
        ? openmct.telemetry.getFormatter(formatKey)
        : new UTCDayOfYearFormat.default();
      const vistaTime = getVistaTime.default({
        options: timePlugin,
        format: utcFormat
      });
      openmct.install(RealtimeIndicatorPlugin.default(vistaTime));

      mcwsClient.default.configure(options);

      openmct.install(MultipleHistoricalSessions.default(options.tablePerformanceOptions));
      openmct.install(RealtimeSessions.default());

      openmct.install(new HistoricalTelemetryPlugin(options));
      openmct.install(new RealtimeTelemetryPlugin(vistaTime, options));
      openmct.install(new TypePlugin.default());
      openmct.install(new TaxonomyPlugin(options.taxonomy));
      openmct.install(new LinkPlugin(options));
      openmct.install(new VenuePlugin.default(options));
      openmct.install(FrameWatchViewPlugin.default(options.tablePerformanceOptions));
      openmct.install(FrameEventFilterViewPlugin.default(options.tablePerformanceOptions));
      openmct.install(new ChannelTablePlugin.default(options.tablePerformanceOptions));
      openmct.install(new ChannelTableSetPlugin.default());
      openmct.install(new ChannelLimitsPlugin.default());
      openmct.install(new FrameAccountabilityPlugin.default(options));
      openmct.install(EVRViewPlugin.default(options));
      openmct.install(new AlarmsViewPlugin.default(options.tablePerformanceOptions));
      openmct.install(MCWSIndicatorPlugin.default());

      if (
        window.openmctMCWSConfig.messageStreamUrl &&
        window.openmctMCWSConfig.messageStreamUrl !== ''
      ) {
        openmct.install(
          new MessageStreamProcessor(window.openmctMCWSConfig.messageStreamUrl, {
            clearData: ['StartOfSession', 'EndOfSession'],
            suspectChannels: ['SuspectChannels']
          })
        );
      }

      if (options.customFormatters.length) {
        openmct.install(CustomFormatterPlugin.default(options.customFormatters));
      }

      openmct.install(CustomFormsPlugin.default());

      openmct.install(openmct.plugins.DefaultRootName('VISTA'));
      openmct.install(
        new ExportDataAction.default([
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
      openmct.install(ActionModifiersPlugin.default());
      openmct.install(new PacketQueryPlugin.default());
      if (options.globalFilters) {
        openmct.install(new GlobalFilters.default(options.globalFilters));
      }
    };
  }

  return AMMOSPlugins;
});
