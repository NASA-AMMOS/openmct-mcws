import AlarmsViewProvider from './AlarmsViewProvider.js';
import AlarmsAutoclearViewProvider from './AlarmsAutoclearViewProvider.js';
import AlarmsViewActions from './AlarmsViewActions.js';
import VistaTableConfigurationProvider from '../tables/VistaTableConfigurationProvider.js';

export default function AlarmsViewPlugin(options) {
  return function install(openmct) {
    openmct.objectViews.addProvider(new AlarmsViewProvider(openmct, options));
    openmct.inspectorViews.addProvider(new AlarmsAutoclearViewProvider(openmct, options));

    AlarmsViewActions.forEach((action) => {
      openmct.actions.register(action);
    });

    openmct.types.addType('vista.alarmsView', {
      name: 'Alarms View',
      description:
        'Drag and drop in an Alarm Message Stream node to show the latest alarm states of channels',
      cssClass: 'icon-tabular-lad',
      creatable: true,
      initialize(domainObject) {
        domainObject.composition = [];
        domainObject.configuration = {
          filters: {}
        };
      }
    });

    openmct.inspectorViews.addProvider(
      new VistaTableConfigurationProvider(
        'vista.alarm-view-configuration',
        'Config',
        'vista.alarmsView',
        openmct,
        options
      )
    );

    openmct.composition.addPolicy((parent, child) => {
      if (parent.type === 'vista.alarmsView') {
        return child.type === 'vista.alarmMessageStream';
      }
      return true;
    });
  };
}
