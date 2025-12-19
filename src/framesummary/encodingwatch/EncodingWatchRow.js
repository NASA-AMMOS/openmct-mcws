import FrameWatchRow from '../FrameWatchRow.js';
import DatasetCache from 'services/dataset/DatasetCache.js';
import Types from '../../types/types.js';

export default class EncodingWatchRow extends FrameWatchRow {
  constructor(datum, columns, objectKeyString, limitEvaluator, rowId, frameEventType) {
    super(datum, columns, objectKeyString, limitEvaluator, rowId);

    this.frameEventType = frameEventType;
  }

  getContextualDomainObject(openmct, objectKeyString) {
    const identifier = openmct.objects.parseKeyString(objectKeyString);
    const matchingType = Types.typeForIdentifier(identifier);
    const data = matchingType.data(identifier);
    const datasetIdentifier = data.datasetIdentifier;

    return DatasetCache()
      .get(datasetIdentifier)
      .then((dataset) => {
        const badFrameEventFilterObjectKey = this.frameEventType.makeFilterIdentifier(
          dataset.identifier,
          'BadTelemetryFrame'
        );

        return openmct.objects.get(badFrameEventFilterObjectKey);
      });
  }

  getContextMenuActions() {
    return ['viewHistoricalData'];
  }
}
