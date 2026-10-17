import TelemetryTableConfiguration from 'openmct.tables.TelemetryTableConfiguration';
import ChannelTableSetConfigurationComponent from './ChannelTableSetConfiguration.vue';
import mount from 'ommUtils/mountVueComponent.js';
import { CHANNEL_TABLE_SET_KEY } from '../constants.js';

export default class ChannelTableSetConfigurationProvider {
  constructor(openmct, options) {
    this.options = options;

    this.key = 'vista.chanTable-configuration';
    this.name = 'Config';
    this.type = CHANNEL_TABLE_SET_KEY;
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
            ChannelTableSetConfiguration: ChannelTableSetConfigurationComponent
          },
          template: '<channel-table-set-configuration></channel-table-set-configuration>'
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
