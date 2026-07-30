import mount from 'ommUtils/mountVueComponent.js';
import TelemetryTableConfiguration from 'openmct.tables.TelemetryTableConfiguration';
import DataProductAutoclear from './data-product-autoclear.vue';

export default class DataProductViewProvider {
  constructor(openmct, options) {
    this.openmct = openmct;
    this.options = options;

    this.key = 'vista.dataProducts-configuration';
    this.name = 'Autoclear';
  }

  canView(selection) {
    const domainObject = selection?.[0]?.[0]?.context?.item;

    return domainObject?.type === 'vista.dataProductsView';
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
            DataProductAutoclear
          },
          template: '<data-product-autoclear></data-product-autoclear>'
        };

        const componentOptions = {
          element
        };

        const { destroy } = mount(componentDefinition, componentOptions);

        _destroy = destroy;
      },
      priority: function () {
        return self.openmct.priority.HIGH;
      },
      destroy: function () {
        _destroy?.();
      }
    };
  }
}
