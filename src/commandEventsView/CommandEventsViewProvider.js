import CommandEventsTable from './CommandEventsTable.js';
import TableComponent from 'openmct.tables.components.Table';
import mount from 'utils/mountVueComponent';

export default class CommandEventsViewProvider {
    constructor(openmct) {
        this.openmct = openmct;

        this.key = 'vista.commandEventsView';
        this.name = 'Command Events View';
        this.cssClass = 'icon-tabular-realtime';
    }

    canView(domainObject) {
        return domainObject.type === 'vista.commandEventsView';
    }

    view(domainObject, objectPath) {
        let component;
        let _destroy = null;

        const table = new CommandEventsTable(domainObject, openmct);
        const markingProp = {
            enable: true,
            useAlternateControlBar: false,
            rowName: '',
            rowNamePlural: ''
        };

        const view = {
            show: function (element, editMode) {
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
                      openmct,
                      table,
                      objectPath,
                      currentView: view
                  },
                  template: `
                      <table-component
                          ref="tableComponent"
                          class="v-data-products"
                          :allowSorting="true"
                          :isEditing="isEditing"
                          :marking="markingProp"
                          :view="view"
                      >
                          <template slot="buttons">
                          </template>
                      </table-component>
                  `
                };

                const componentOptions = {
                    element
                };

                const {
                  componentInstance,
                  destroy,
                  el
                } = mount(componentDefinition, componentOptions);
                
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
                    return component.$refs.tableComponent.getViewContext();
                } else {
                    return {
                        type: 'telemetry-table'
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
        return domainObject.type === 'vista.commandEventsView';
    }
}
