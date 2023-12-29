import CellFormatConfigurationComponent from './CellFormatConfigurationComponent.vue';
import TelemetryTableConfiguration from 'openmct.tables.TelemetryTableConfiguration';
import { createApp } from 'vue';

export default function ChannelTableFormatViewProvider(openmct) {
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
      let component;
      let _destroy = null;
      let domainObject = selection[0][1].context.item;
      const tableConfiguration = new TelemetryTableConfiguration(domainObject, openmct);

      return {
        show: function (element) {
          component = createApp({
            provide: {
              openmct,
              tableConfiguration
            },
            components: {
              CellFormatConfiguration: CellFormatConfigurationComponent
            },
            template: '<cell-format-configuration></cell-format-configuration>',
          });

          _destroy = () => component.unmount();
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

