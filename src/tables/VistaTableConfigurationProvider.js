import TelemetryTableConfiguration from 'openmct.tables.TelemetryTableConfiguration';
import TableConfigurationComponent from 'openmct.tables.components.TableConfiguration';
import mount from 'ommUtils/mountVueComponent.js';

export default class VistaTableConfigurationProvider {
  constructor(
    key,
    name,
    type,
    openmct,
    options,
    configurationComponent = TableConfigurationComponent
  ) {
    this.options = options;
    this.configurationComponent = configurationComponent;

    this.key = key;
    this.name = name;
    this.type = type;
    this.openmct = openmct;
  }

  canView(selection) {
    const domainObject = selection?.[0]?.[0]?.context?.item;

    return domainObject?.type === this.type;
  }

  view(selection) {
    let _destroy = null;
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
            TableConfiguration: self.configurationComponent
          },
          template: '<table-configuration></table-configuration>'
        };

        const componentOptions = {
          element
        };

        const { destroy } = mount(componentDefinition, componentOptions);

        _destroy = destroy;
      },
      showTab: function (isEditing) {
        return isEditing;
      },
      priority: function () {
        return self.openmct.priority.HIGH + 1;
      },
      destroy: function () {
        _destroy?.();
      }
    };
  }
}
