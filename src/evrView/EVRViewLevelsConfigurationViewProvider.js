import EVRViewLevelsConfigurationView from './EVRViewLevelsConfigurationView.vue';
import mount from 'ommUtils/mountVueComponent.js';

export default function EVRViewLevelsConfigurationViewProvider(openmct, options) {
  return {
    key: 'vista.evrView-configuration',
    name: 'Level Color',
    canView: function (selection) {
      if (selection.length === 0) {
        return false;
      }

      let object = selection[0][0].context.item;

      return object && object.type === 'vista.evrView';
    },
    view: function (selection) {
      let _destroy = null;

      const domainObject = selection[0][0].context.item;

      return {
        show: function (element) {
          const componentDefinition = {
            provide: {
              openmct
            },
            data() {
              return {
                domainObject: domainObject,
                options: options
              };
            },
            components: {
              EvrLevelsConfiguration: EVRViewLevelsConfigurationView
            },
            template: `
                            <evr-levels-configuration
                                :domain-object="domainObject"
                                :options="options"
                            ></evr-levels-configuration>
                        `
          };

          const componentOptions = {
            element
          };

          const { destroy } = mount(componentDefinition, componentOptions);

          _destroy = destroy;
        },
        priority: function () {
          return openmct.priority.HIGH;
        },
        destroy: function () {
          _destroy?.();
        }
      };
    }
  };
}
