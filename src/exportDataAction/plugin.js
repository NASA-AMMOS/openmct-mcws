import ExportDataAction from './ExportDataAction.js';

export default function (validTypes) {
  return function (openmct) {
    openmct.actions.register(new ExportDataAction(openmct, validTypes));
  };
}
