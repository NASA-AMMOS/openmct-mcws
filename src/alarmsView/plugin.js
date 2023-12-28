import AlarmsViewProvider from './AlarmsViewProvider';
import AlarmsAutoclearViewProvider from './AlarmsAutoclearViewProvider';
import AlarmsViewActions from './AlarmsViewActions';
import VistaTableConfigurationProvider from '../tables/VistaTableConfigurationProvider';

export default function AlarmsViewPlugin() {
    return function install(openmct) {
        openmct.objectViews.addProvider(new AlarmsViewProvider(openmct));
        openmct.inspectorViews.addProvider(new AlarmsAutoclearViewProvider(openmct));

        AlarmsViewActions.forEach(action => {
            openmct.actions.register(action);
        });

        openmct.types.addType('vista.alarmsView', {
            name: "Alarms View",
            description: "Drag and drop in an Alarm Message Stream node to show the latest alarm states of channels",
            cssClass: "icon-tabular-lad",
            creatable: true,
            initialize(domainObject) {
                domainObject.composition = [];
                domainObject.configuration = {
                    filters: {}
                };
            }
        });

        openmct.inspectorViews.addProvider(new VistaTableConfigurationProvider(
            'vista.alarm-view-configuration', 
            'Config',
            'vista.alarmsView'
        ));

        openmct.composition.addPolicy((parent, child) => {
            if (parent.type === 'vista.alarmsView') {
                return child.type === 'vista.alarmMessageStream'
            }
            return true;
        });
    }
}
