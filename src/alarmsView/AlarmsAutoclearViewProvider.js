import mount from 'utils/mountVueComponent';
import AlarmsAutoclear from './AlarmsAutoclear.vue';
import TelemetryTableConfiguration from 'openmct.tables.TelemetryTableConfiguration';

export default class AlarmsAutoClearViewProvider {
  constructor(openmct) {
    this.key = 'vista.alarmsView-configuration';
    this.name = 'Autoclear';
    this.openmct = openmct;
    this._destroy = null;
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
        const componentDefinition = {
          provide: {
            openmct,
            tableConfiguration
          },
          components: {
            AlarmsAutoclear
          },
          template: '<AlarmsAutoclear />'
        };
        const componentOptions = {
          element
        };

        const {
          componentInstance,
          destroy,
          el
        } = mount(componentDefinition, componentOptions);

        this._destroy = destroy;
      },
      priority: function () {
        return openmct.priority.HIGH;
      },
      destroy: function () {
        this._destroy?.();
      }
    }
  }
}
