import TelemetryTableRow from 'openmct.tables.TelemetryTableRow';
import DatasetCache from 'services/dataset/DatasetCache';
import Types from 'types/types';
import { VIEW_COMMAND_ACTION_KEY } from './ViewCommandAction.js';

/**
 * Key string of the vista.command object for a command-dictionary row,
 * e.g. "vista:command:<dataset-keystring>:<stem>".
 */
export function makeCommandObjectKeyString(datasetIdentifier, stem) {
  const commandType = Types.typeForKey('vista.command');

  return 'vista:' + commandType.makeId(datasetIdentifier, stem);
}

export default class CommandDictionaryTableRow extends TelemetryTableRow {
  getContextualDomainObject(openmct, objectKeyString) {
    const identifier = openmct.objects.parseKeyString(objectKeyString);
    const matchingType = Types.typeForIdentifier(identifier);
    const data = matchingType.data(identifier);

    return DatasetCache()
      .get(data.datasetIdentifier)
      .then((dataset) => {
        return openmct.objects.get(makeCommandObjectKeyString(dataset.identifier, this.datum.stem));
      });
  }

  getContextMenuActions() {
    return [VIEW_COMMAND_ACTION_KEY];
  }
}
