import FrameWatchRow from '../FrameWatchRow';
import DatasetCache from 'services/dataset/DatasetCache';
import Types from '../../types/types';

export default class EncodingWatchRow extends FrameWatchRow {
    constructor(datum, columns, objectKeyString, limitEvaluator, rowId, frameEventType) {
        super(datum, columns, objectKeyString, limitEvaluator, rowId);

        this.datasetCache = DatasetCache();
        this.frameEventType = frameEventType;
    }

    getContextualDomainObject(openmct, objectKeyString) {
        const identifier = openmct.objects.parseKeyString(objectKeyString);
        const matchingType = Types.typeForIdentifier(identifier);
        const data = matchingType.data(identifier);
        const datasetIdentifier = data.datasetIdentifier;

        return this.datasetCache.get(datasetIdentifier).then(dataset => {
            const badFrameEventFilterObjectKey = this.frameEventType.makeFilterIdentifier(dataset.identifier, 'BadTelemetryFrame');

            return openmct.objects.get(badFrameEventFilterObjectKey);
        });
    }

    getContextMenuActions() {
        return ['viewHistoricalData'];
    }    
}
