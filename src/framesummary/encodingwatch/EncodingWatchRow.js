import FrameWatchRow from '../FrameWatchRow';
import DatasetCache from 'services/dataset/DatasetCache';

export default class EncodingWatchRow extends FrameWatchRow {
    constructor(datum, columns, objectKeyString, limitEvaluator, rowId, frameEventType) {
        super(datum, columns, objectKeyString, limitEvaluator, rowId);

        this.datasetCache = DatasetCache();
        this.frameEventType = frameEventType;
    }

    getContextualDomainObject(openmct, objectKeyString) {
        const objectKeyStringArray = objectKeyString.split(":");
        const datasetIdentifier = {
            namespace: objectKeyStringArray[objectKeyStringArray.length - 2],
            key: objectKeyStringArray[objectKeyStringArray.length - 1]
        }
        
        return this.datasetCache.get(datasetIdentifier).then(dataset => {
            const badFrameEventFilterObjectKey = this.frameEventType.makeFilterIdentifier(dataset.identifier, 'BadTelemetryFrame');

            return openmct.objects.get(badFrameEventFilterObjectKey);
        });
    }

    getContextMenuActions() {
        return ['viewHistoricalData'];
    }    
}
