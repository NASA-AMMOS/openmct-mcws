import UrlFieldFormController from './UrlField/UrlFieldFormController';

export default function CustomFormsPlugin() {
  return function install(openmct) {
    openmct.forms.addNewFormControl('url-field', UrlFieldFormController(openmct));
  };
}
