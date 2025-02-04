import mount from 'ommUtils/mountVueComponent';
import FrameWatchTableConfiguration from './FrameWatchTableConfiguration';
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
    const domainObject = selection[0][0].context.item;
    const tableConfiguration = new FrameWatchTableConfiguration(domainObject, openmct, this.type);

    return {
      show: function (element) {
        const componentDefinition = {
          provide: {
            openmct: this.openmct,
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

        const { componentInstance, destroy, el } = mount(componentDefinition, componentOptions);

        this._destroy = destroy;
      },
      priority: function () {
        return this.openmct.priority.HIGH + 1;
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
