import UrlField from './UrlField.vue';
import mount from 'ommUtils/mountVueComponent';

export default function UrlFieldFormController(openmct) {
  let _destroy = null;

  return {
    show(element, model, onChange) {
      const componentDefinition = {
        components: {
          UrlField
        },
        provide: {
          openmct
        },
        data() {
          return {
            model,
            onChange
          };
        },
        template: `<UrlField :model="model" @onChange="onChange" />`
      };

      const componentOptions = {
        element
      };

      const { componentInstance, destroy, el } = mount(componentDefinition, componentOptions);

      _destroy = destroy;
    },
    destroy: function () {
      _destroy?.();
    }
  };
}
