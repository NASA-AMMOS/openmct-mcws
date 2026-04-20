import MessagesTable from './MessagesTable.js';
import TableComponent from 'openmct.tables.components.Table';
import mount from 'ommUtils/mountVueComponent.js';

export default class MessagesViewProvider {
  constructor(openmct, options) {
    this.openmct = openmct;
    this.options = options;

    this.key = 'vista.messagesView';
    this.name = 'Messages View';
    this.cssClass = 'icon-tabular-lad';
  }

  canView(domainObject) {
    return domainObject.type === 'vista.messagesView';
  }

  view(domainObject, objectPath) {
    let component;
    let _destroy = null;
    const self = this;

    const table = new MessagesTable(domainObject, this.openmct, this.options);
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
          template: `
                        <table-component
                            ref="tableComponent"
                            class="v-messages"
                            :isEditing="isEditing"
                            :allowSorting="true"
                            :marking="markingProp"
                            :view="view"
                        >
                        </table-component>
                    `
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
    return domainObject.type === 'vista.messagesView';
  }
}
