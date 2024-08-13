import CellFormatConfigurationComponent from './CellFormatConfigurationComponent.vue';
import TelemetryTableConfiguration from 'openmct.tables.TelemetryTableConfiguration';
import mount from 'utils/mountVueComponent';

export default function ChannelTableFormatViewProvider(openmct, options) {
  return {
    key: 'channel-list-format',
    name: 'Format',
    canView: function (selection) {
      let selectionPath = selection[0];
      if (selectionPath && selectionPath.length > 1) {
        let parentObject = selectionPath[1].context.item;
        let selectedContext = selectionPath[0].context;
        return parentObject && 
          parentObject.type === 'vista.chanTableGroup' &&
          selectedContext.type === 'table-cell';
      }
      return false;
    },
    view: function (selection) {
      let _destroy = null;
      let domainObject = selection[0][1].context.item;
      const tableConfiguration = new TelemetryTableConfiguration(domainObject, openmct, options);

      return {
        show: function (element) {
          const componentDefinition = {
            provide: {
              openmct,
              tableConfiguration
            },
            components: {
              CellFormatConfiguration: CellFormatConfigurationComponent
            },
            template: '<cell-format-configuration></cell-format-configuration>',
          };
          const componentOptions = {
            element
          };

          const {
            componentInstance,
            destroy,
            el
          } = mount(componentDefinition, componentOptions);

          _destroy = destroy;
        },
        priority: function () {
          return openmct.priority.HIGH;
        },
        destroy: function () {
          _destroy?.();
        }
      }
    }
  }
}

