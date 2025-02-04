import EVRTable from './EVRTable';
import TableComponent from 'openmct.tables.components.Table';
import mount from 'ommUtils/mountVueComponent';

const RESTRICTED_VIEWS = ['plot-single', 'table'];
const EVR_SOURCES = ['evrHistoricalUrl', 'evrStreamUrl', 'evrLADUrl'];

function providesEVRData(domainObject) {
  return EVR_SOURCES.some((evrSource) => Boolean(domainObject.telemetry?.[evrSource]));
}
export default class EVRViewProvider {
  constructor(openmct, options) {
    this.key = 'vista.evrView';
    this.name = 'EVR View';
    this.cssClass = 'icon-tabular-realtime';
    this.openmct = openmct;
    this.options = options;

    this.view = this.view.bind(this);
  }

  canView(domainObject) {
    // suppress plot and table views for evr providing telemetry
    const wrappedGet = this.openmct.objectViews.get;
    this.openmct.objectViews.get = function (object) {
      return wrappedGet
        .apply(this, arguments)
        .filter(
          (viewProvider) =>
            !(providesEVRData(object) && RESTRICTED_VIEWS.includes(viewProvider.key))
        );
    };

    return providesEVRData(domainObject) || domainObject.type === 'vista.evrView';
  }

  view(domainObject, objectPath) {
    let component;
    let _destroy = null;

    const table = new EVRTable(domainObject, this.openmct, this.options);
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
          provide: {
            openmct,
            table,
            objectPath,
            currentView: view,
            renderWhenVisible
          },
          data() {
            return {
              isEditing: editMode,
              markingProp
            };
          },
          template: `
                        <table-component
                            ref="tableComponent"
                            :is-editing="isEditing"
                            :allow-sorting="true"
                            :marking="markingProp"
                        ></table-component>
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

  canEdit(domainObject) {
    return domainObject.type === 'vista.evrView';
  }
}
