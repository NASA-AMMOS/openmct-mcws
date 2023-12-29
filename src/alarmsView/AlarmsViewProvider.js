import { createApp } from 'vue';
import TableComponent from 'openmct.tables.components.Table';
import AlarmsTable from './AlarmsTable.js';

export default class AlarmsViewProvider {
    constructor(openmct) {
        this.openmct = openmct;

        this.key = 'vista.alarmsView';
        this.name = 'Alarms Table';
        this.cssClass = 'icon-tabular-lad';
    }

    canView(domainObject) {
        return domainObject.type === "vista.alarmsView" || domainObject.type === "vista.alarmMessageStream";
    }

    view(domainObject, objectPath) {
        let table = new AlarmsTable(domainObject, openmct);
        let component;
        let _destroy = null;
        let markingProp = {
            enable: true,
            useAlternateControlBar: false,
            rowName: '',
            rowNamePlural: ''
        };
        const view = {
            show: function (element, editMode) {
                component = createApp({
                    components: {
                        TableComponent
                    },
                    data() {
                        return {
                            isEditing: editMode,
                            markingProp,
                            view
                        };
                    },
                    provide: {
                        openmct,
                        table,
                        objectPath,
                        currentView: view
                    },
                    template:
                        `<table-component 
                            ref="tableComponent"
                            :allowSorting="true"
                            :isEditing="isEditing" 
                            :marking="markingProp"
                            :view="view"
                        />`
                });

                _destroy = () => component.unmount;
            },
            onEditModeChange(editMode) {
                component.isEditing = editMode;
            },
            onClearData() {
                table.clearData();
            },
            getViewContext() {
                if (component) {
                    const context = component.$refs.tableComponent.getViewContext();

                    context['vista.alarmsView'] = true;
                    context.clearOutOfAlarmRows = () => {
                        table.clearOutOfAlarmRows();
                    };

                    return context;
                } else {
                    return {
                        type: 'telemetry-table',
                        'vista.alarmsView': true
                    };
                }
            },
            destroy: function (element) {
                _destroy?.();
            }
        };

        return view;
    }
     
    canEdit(domainObject) {
        return domainObject.type === "vista.alarmsView";
    }
}
