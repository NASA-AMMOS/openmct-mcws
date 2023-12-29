import { createApp } from 'vue';
import AlarmsAutoclear from './AlarmsAutoclear.vue';
import TelemetryTableConfiguration from 'openmct.tables.TelemetryTableConfiguration';

export default class AlarmsAutoClearViewProvider {
  constructor(openmct) {
    this.key = 'vista.alarmsView-configuration';
    this.name = 'Autoclear';
    this.openmct = openmct;
    this.component = undefined;
    this.destroy = null;
  }

  canView(selection) {
    if (selection.length === 0) {
        return false;
    }

    const domainObject = selection[0][0].context.item;

    return domainObject?.type === 'vista.alarmsView';
  }

  view(selection) {
    const domainObject = selection[0][0].context.item;
    const tableConfiguration = new TelemetryTableConfiguration(domainObject, openmct);

    return {
      show: function (element) {
        this.component = createApp({
          provide: {
            openmct,
            tableConfiguration
          },
          components: {
            AlarmsAutoclear
          },
          template: '<AlarmsAutoclear />'
        });

        this.destroy = () => this.component.unmount();
      },
      priority: function () {
        return openmct.priority.HIGH;
      },
      destroy: function () {
        this.destroy?.();
      }
    }
  }
}
