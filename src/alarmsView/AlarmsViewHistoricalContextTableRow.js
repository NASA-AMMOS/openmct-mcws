import TelemetryTableRow from 'openmct.tables.TelemetryTableRow';
import DatasetCache from 'services/dataset/DatasetCache';
import Types from 'types/types';

export default class AlarmsViewHistoricalContextTableRow extends TelemetryTableRow {
  getContextualDomainObject(openmct, objectKeyString) {
    const identifier = openmct.objects.parseKeyString(objectKeyString);
    const matchingType = Types.typeForIdentifier(identifier);
    const data = matchingType.data(identifier);
    const datasetIdentifier = data.datasetIdentifier;

    return DatasetCache()
      .get(datasetIdentifier)
      .then((dataset) => {
        const channelType = Types.typeForKey('vista.channel');
        const objectKeyString =
          'vista:' + channelType.makeId(dataset.identifier, this.datum.channel_id);

        return openmct.objects.get(objectKeyString);
      });
  }

  getContextMenuActions() {
    return ['viewHistoricalData'];
  }

  getRowId() {
    return `${this.datum.channel_id}#${this.datum.session_id}`;
  }
}
