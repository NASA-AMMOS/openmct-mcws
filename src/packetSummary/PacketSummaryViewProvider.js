import mount from 'ommUtils/mountVueComponent';
import PacketSummaryTable from './PacketSummaryTable.js';
import PacketSummaryViewComponent from './components/PacketSummaryViewComponent.vue';

export default class ProductSummaryViewProvider {
  constructor(openmct, options) {
    this.openmct = openmct;
    this.options = options;

    this.key = 'vista.packetSummaryViewProvider';
    this.name = 'Packet Summary View';
    this.cssClass = 'icon-tabular-realtime';
  }

  canView(domainObject) {
    return (
      domainObject.type === 'vista.packetSummaryEvents' ||
      domainObject.type === 'vista.packetSummaryView'
    );
  }

  view(domainObject, objectPath) {
    let component;
    let _destroy = null;
    const self = this;

    const table = new PacketSummaryTable(domainObject, this.openmct, this.options);

    const view = {
      show: function (element, editMode, { renderWhenVisible }) {
        const componentDefinition = {
          components: {
            PacketSummaryViewComponent
          },
          data() {
            return {
              isEditing: editMode,
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
          template: `<packet-summary-view-component
                            ref="packetSummaryViewComponent"
                            :view="view"
                            :isEditing="isEditing"
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
          let context = component.$refs.packetSummaryViewComponent.getViewContext();

          return context;
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
    return domainObject.type === 'vista.packetSummaryView';
  }
}
