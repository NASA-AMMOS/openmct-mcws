import FrameEventFilterTable from './FrameEventFilterTable.js';
import TableComponent from 'openmct.tables.components.Table';
import mount from 'ommUtils/mountVueComponent';

export default class FrameEventFilterViewProvider {
  constructor(openmct, options) {
    this.openmct = openmct;
    this.options = options;

    this.key = 'vista.frameEventFilterView';
    this.name = 'Frame Events Filtered View';
    this.cssClass = 'icon-tabular-realtime';
  }

  canView(domainObject) {
    return domainObject.type === 'vista.frame-event-filter';
  }

  view(domainObject, objectPath) {
    let component;
    let _destroy = null;

    let table = new FrameEventFilterTable(domainObject, openmct, this.options);
    let markingProp = {
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
              markingProp
            };
          },
          provide: {
            openmct,
            table,
            objectPath,
            currentView: view,
            renderWhenVisible
          },
          template: `
                        <table-component
                            ref="tableComponent"
                            class="v-data-products"
                            :allowSorting="true"
                            :isEditing="isEditing"
                            :marking="markingProp"
                        >
                            <template slot="buttons">
                            </template>
                        </table-component>
                    `
        };

        const componentOptions = {
          element
        };

        const { componentInstance, destroy, el } = mount(componentDefinition, componentOptions);

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
}
