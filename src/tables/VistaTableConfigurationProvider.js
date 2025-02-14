import TelemetryTableConfiguration from 'openmct.tables.TelemetryTableConfiguration';
import TableConfigurationComponent from 'openmct.tables.components.TableConfiguration';
import mount from 'ommUtils/mountVueComponent';

export default class VistaTableConfigurationProvider {
  constructor(key, name, type, options) {
    this.options = options;

    this.key = key;
    this.name = name;
    this.type = type;
  }

  canView(selection) {
    const domainObject = selection?.[0]?.[0]?.context?.item;

    return domainObject?.type === this.type;
  }

  view(selection) {
    let _destroy = null;

    const domainObject = selection[0][0].context.item;
    const tableConfiguration = new TelemetryTableConfiguration(domainObject, openmct, this.options);

    return {
      show: function (element) {
        const componentDefinition = {
          provide: {
            openmct,
            tableConfiguration
          },
          components: {
            TableConfiguration: TableConfigurationComponent
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
        return openmct.priority.HIGH + 1;
      },
      destroy: function () {
        _destroy?.();
      }
    };
  }
}
