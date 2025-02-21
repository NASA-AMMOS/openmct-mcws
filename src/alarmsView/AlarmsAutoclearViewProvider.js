import mount from 'ommUtils/mountVueComponent';
import AlarmsAutoclear from './AlarmsAutoclear.vue';
import TelemetryTableConfiguration from 'openmct.tables.TelemetryTableConfiguration';

export default class AlarmsAutoClearViewProvider {
  constructor(openmct, options) {
    this.key = 'vista.alarmsView-configuration';
    this.name = 'Autoclear';

    this.openmct = openmct;
    this.options = options;
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
    const self = this;
    const domainObject = selection[0][0].context.item;
    const tableConfiguration = new TelemetryTableConfiguration(
      domainObject,
      this.openmct,
      this.options
    );

    return {
      show: function (element) {
        const componentDefinition = {
          provide: {
            openmct: self.openmct,
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

        const { destroy } = mount(componentDefinition, componentOptions);

        this._destroy = destroy;
      },
      priority: function () {
        return self.openmct.priority.HIGH;
      },
      destroy: function () {
        this._destroy?.();
      }
    };
  }
}
