import AlarmsViewProvider from './AlarmsViewProvider';
import AlarmsViewActions from './AlarmsViewActions';
import AlarmsViewTimeoutComponent from './alarms-view-timeout.vue';
import VistaTableConfigurationProvider from '../tables/VistaTableConfigurationProvider';
import TelemetryTableConfiguration from 'openmct.tables.TelemetryTableConfiguration';
import Vue from 'vue';

export default function AlarmsViewPlugin() {
    return function install(openmct) {
        openmct.objectViews.addProvider(new AlarmsViewProvider(openmct));

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
        openmct.inspectorViews.addProvider({
            key: 'vista.alarmsView-configuration',
            name: 'Autoclear',
            canView: function (selection) {
                if (selection.length === 0) {
                    return false;
                }
                let object = selection[0][0].context.item;
                return object && object.type === 'vista.alarmsView';
            },
            view: function (selection) {
                let component;
                let domainObject = selection[0][0].context.item;
                const tableConfiguration = new TelemetryTableConfiguration(domainObject, openmct);
                return {
                    show: function (element) {
                        component = new Vue({
                            provide: {
                                openmct,
                                tableConfiguration
                            },
                            components: {
                                AlarmsViewTimeout: AlarmsViewTimeoutComponent
                            },
                            template: '<alarms-view-timeout></alarms-view-timeout>',
                            el: element
                        });
                    },
                    priority: function () {
                      return openmct.priority.HIGH;
                    },
                    destroy: function () {
                        component.$destroy();
                        component = undefined;
                    }
                }
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
