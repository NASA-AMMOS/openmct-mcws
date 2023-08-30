import UrlField from './components/UrlField.vue';
import Vue from 'vue';

export default function CustomFormsPlugin() {
  return function install(openmct) {
    openmct.forms.addNewFormControl('urlfield', urlFieldControlViewProvider(openmct));
  }
}

function urlFieldControlViewProvider(openmct) {
  let component;

  return {
    show(element, model, onChange) {
      component = new Vue(
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
      console.log(component);
    }
  };
}
