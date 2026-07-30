import UrlFieldFormController from './UrlField/UrlFieldFormController.js';

export default function CustomFormsPlugin() {
  return function install(openmct) {
    openmct.forms.addNewFormControl('url-field', UrlFieldFormController(openmct));
  };
}
