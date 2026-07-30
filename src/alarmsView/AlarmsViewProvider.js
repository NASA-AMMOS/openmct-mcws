import mount from 'ommUtils/mountVueComponent.js';
import TableComponent from 'openmct.tables.components.Table';
import AlarmsTable from './AlarmsTable.js';

export default class AlarmsViewProvider {
  constructor(openmct, options) {
    this.openmct = openmct;
    this.options = options;

    this.key = 'vista.alarmsView';
    this.name = 'Alarms Table';
    this.cssClass = 'icon-tabular-lad';
  }

  canView(domainObject) {
    return (
      domainObject.type === 'vista.alarmsView' || domainObject.type === 'vista.alarmMessageStream'
    );
  }

  view(domainObject, objectPath) {
    let component;
    let _destroy = null;
    const self = this;

    const table = new AlarmsTable(domainObject, this.openmct, this.options);
    const markingProp = {
      enable: true,
      useAlternateControlBar: false,
      rowName: '',
      rowNamePlural: ''
    };
    const view = {
      show: function (element, editMode, { renderWhenVisible }) {
        const componentDefinition = {
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
            openmct: self.openmct,
            table,
            objectPath,
            currentView: view,
            renderWhenVisible
          },
          template: `<table-component 
                            ref="tableComponent"
                            :allowSorting="true"
                            :isEditing="isEditing" 
                            :marking="markingProp"
                            :view="view"
                        />`
        };
        const componentOptions = {
          element
        };

        const { componentInstance, destroy } = mount(componentDefinition, componentOptions);

        component = componentInstance;
        _destroy = destroy;
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
      destroy: function () {
        _destroy?.();
      }
    };

    return view;
  }

  canEdit(domainObject) {
    return domainObject.type === 'vista.alarmsView';
  }
}
