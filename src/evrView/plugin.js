import EVRViewProvider from './EVRViewProvider.js';
import EVRViewLevelsConfigurationViewProvider from './EVRViewLevelsConfigurationViewProvider.js';
import EVRPauseCountdownAction from './EVRPauseCountdownAction.js';
import EVRTableConfiguration from './EVRTableConfiguration.vue';
import VistaTableConfigurationProvider from '../tables/VistaTableConfigurationProvider.js';
import EVRHistoricalDataActions from './EVRHistoricalDataActions.js';

export default function EVRViewPlugin(options) {
  const { taxonomy, tablePerformanceOptions } = options;

  return function install(openmct) {
    openmct.objectViews.addProvider(new EVRViewProvider(openmct, tablePerformanceOptions));

    EVRHistoricalDataActions(openmct).forEach((action) => openmct.actions.register(action));
    openmct.actions.register(EVRPauseCountdownAction());

    openmct.types.addType('vista.evrView', {
      name: 'EVR View',
      description: 'Drag and drop EVR node(s) and/or EVR module(s) to show Event Records.',
      cssClass: 'icon-tabular-realtime',
      creatable: true,
      initialize(domainObject) {
        domainObject.composition = [];
        domainObject.configuration = {
          filters: {},
          pauseTimerSeconds: null
        };
      }
    });

    openmct.inspectorViews.addProvider(
      new EVRViewLevelsConfigurationViewProvider(openmct, taxonomy)
    );

    openmct.inspectorViews.addProvider(
      new VistaTableConfigurationProvider(
        'vista.evr-view-configuration',
        'Config',
        'vista.evrView',
        openmct,
        tablePerformanceOptions,
        EVRTableConfiguration
      )
    );

    openmct.composition.addPolicy((parent, child) => {
      if (parent.type === 'vista.evrView') {
        return (
          child.type === 'vista.evr' ||
          child.type === 'vista.evrModule' ||
          child.type === 'vista.evrSource'
        );
      }

      return true;
    });
  };
}
