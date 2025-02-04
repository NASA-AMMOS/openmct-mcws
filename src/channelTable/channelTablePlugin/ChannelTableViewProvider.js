import ChannelTable from './ChannelTable';
import TableComponent from 'openmct.tables.components.Table';
import mount from 'ommUtils/mountVueComponent';

export default class ChannelTableViewProvider {
  constructor(openmct, options) {
    this.openmct = openmct;
    this.options = options;

    this.key = 'vista.channel-list';
    this.name = 'Channel List';
    this.cssClass = 'icon-tabular-realtime';

    this.view = this.view.bind(this);
  }

  canView(domainObject) {
    return domainObject.type === 'vista.chanTableGroup';
  }

  canEdit(domainObject) {
    return domainObject.type === 'vista.chanTableGroup';
  }

  view(domainObject, objectPath) {
    let component;
    let _destroy = null;

    const markingProp = {
      enable: true,
      useAlternateControlBar: false,
      rowName: '',
      rowNamePlural: ''
    };
    const table = new ChannelTable(domainObject, this.openmct, this.options);

    const view = {
      show(element, isEditing, { renderWhenVisible }) {
        const componentDefinition = {
          data() {
            return {
              isEditing,
              markingProp,
              view
            };
          },
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
          template: `
                    <table-component
                        :class="'js-channel-list-view'"
                        ref="tableComponent"
                        :isEditing="isEditing"
                        :marking="markingProp"
                        :allowFiltering="false"
                        :allowSorting="true"
                        :view="view"
                    ></table-component>`
        };
        const componentOptions = {
          element
        };

        const { componentInstance, destroy, el } = mount(componentDefinition, componentOptions);

        component = componentInstance;
        _destroy = destroy;
      },
      onEditModeChange(isEditing) {
        component.isEditing = isEditing;
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
      destroy() {
        _destroy?.();
      }
    };

    return view;
  }

  priority() {
    return 851;
  }
}
