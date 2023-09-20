import UrlField from './UrlField.vue'
import Vue from 'vue';

export default function UrlFieldFormController(openmct) {
  let _component;

  return {
    show(element, model, onChange) {
      _component = new Vue(
        {
          el: element,
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
        }
      );
    },
    destroy: function (element) {
      if (_component) {
        _component.$destroy();
        _component = undefined;
      }
    }
  };
}
