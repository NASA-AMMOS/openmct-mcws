import openmctMCWSPlugin from './plugin.js';
import openmct from 'openmct';

document.addEventListener(
  'DOMContentLoaded',
  async () => {
    const config = window.openmctMCWSConfig;
    openmct.setAssetPath(config.assetPath || 'node_modules/openmct/dist');

    //Optional Themes
    if (config.theme) {
      openmct.install(openmct.plugins[config.theme]());
    } else {
      openmct.install(openmct.plugins.Snow());
    }

    if (config.useDeveloperStorage) {
      openmct.install(openmct.plugins.LocalStorage());
      openmct.install(openmct.plugins.MyItems());
    }

    openmct.install(
      openmct.plugins.Filters([
        'vista.alarmsView',
        'telemetry.plot.overlay',
        'table',
        'vista.chanTableGroup',
        'vista.commandEventsView',
        'vista.messagesView',
        'vista.evrView'
      ])
    );
    openmct.install(openmct.plugins.ObjectMigration());
    openmct.install(
      openmct.plugins.DisplayLayout({
        showAsView: [
          'summary-widget',
          'vista.packetSummaryEvents',
          'vista.dataProducts',
          'vista.packets',
          'vista.frameSummary',
          'vista.frameWatch'
        ]
      })
    );
    openmct.install(
      openmct.plugins.ClearData(
        [
          'table',
          'telemetry.plot.overlay',
          'telemetry.plot.stacked',
          'vista.packetSummaryEvents',
          'vista.dataProducts',
          'vista.packets',
          'vista.frameSummary',
          'vista.frameWatch',
          'vista.chanTableGroup'
        ],
        {
          indicator: false
        }
      )
    );
    openmct.install(openmct.plugins.UTCTimeSystem());
    openmct.install(openmct.plugins.Notebook());
    openmct.install(openmct.plugins.Clock({ useClockIndicator: false }));

    // install optional plugins, summary widget is handled separately as it was added long ago
    if (config.plugins) {
      if (
        config.plugins.summaryWidgets === true ||
        config.plugins.summaryWidgets?.enabled === true
      ) {
        openmct.install(openmct.plugins.SummaryWidget());
      }

      Object.entries(config.plugins).forEach(([plugin, pluginConfig]) => {
        const pluginExists = openmct.plugins[plugin] || openmct.plugins.example[plugin];
        const pluginEnabled = pluginConfig?.enabled;
        const isSummaryWidget = plugin === 'summaryWidgets';
        const installPlugin = pluginExists && pluginEnabled && !isSummaryWidget;

        if (installPlugin) {
          openmct.install(openmct.plugins[plugin](...(pluginConfig.configuration ?? [])));
        } else if (!pluginExists) {
          console.warn(`Plugin ${plugin} does not exist. Check the plugin name and try again.`);
        }
      });
    }

    openmct.install(openmctMCWSPlugin(config));
    openmct.start();
  },
  { once: true }
);
