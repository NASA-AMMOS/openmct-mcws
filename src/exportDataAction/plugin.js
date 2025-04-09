import ExportDataAction from './ExportDataAction';

export default function (validTypes) {
  return function (openmct) {
    openmct.actions.register(new ExportDataAction(openmct, validTypes));
  };
}
