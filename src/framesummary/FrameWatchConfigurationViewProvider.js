import mount from 'ommUtils/mountVueComponent.js';
import FrameWatchTableConfiguration from './FrameWatchTableConfiguration.js';
import TableConfigurationComponent from 'openmct.tables.components.TableConfiguration';

export default class FrameWatchConfigurationViewProvider {
  constructor(openmct, key, name, type) {
    this.key = key;
    this.name = name;
    this.type = type;

    this.openmct = openmct;
    this._destroy = null;
  }

  canView(selection) {
    if (selection.length === 0) {
      return false;
    }
    let object = selection[0][0].context.item;
    return object && object.type === this.type;
  }

  view(selection) {
    const self = this;
    const domainObject = selection[0][0].context.item;
    const tableConfiguration = new FrameWatchTableConfiguration(
      domainObject,
      this.openmct,
      this.type
    );

    return {
      show: function (element) {
        const componentDefinition = {
          provide: {
            openmct: self.openmct,
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

        this._destroy = destroy;
      },
      priority: function () {
        return self.openmct.priority.HIGH + 1;
      },
      destroy: function () {
        this._destroy?.();
      }
    };
  }

  priority() {
    return 1;
  }
}
