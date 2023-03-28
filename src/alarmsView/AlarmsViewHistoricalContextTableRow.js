import TelemetryTableRow from 'openmct.tables.TelemetryTableRow';
import DatasetCache from 'services/dataset/DatasetCache';

export default class AlarmsViewHistoricalContextTableRow extends TelemetryTableRow {
    constructor(datum, columns, objectKeyString, limitEvaluator, channelType) {
        super(datum, columns, objectKeyString, limitEvaluator);

        this.channelType = channelType;
        this.datasetCache = DatasetCache();
    }

    getContextualDomainObject(openmct, objectKeyString) {
        const objectKeyStringArray = objectKeyString.split(":");
        const datasetIdentifier = {
            namespace: objectKeyStringArray[objectKeyStringArray.length - 2],
            key: objectKeyStringArray[objectKeyStringArray.length - 1]
        }
        
        return this.datasetCache.get(datasetIdentifier).then(dataset => {
            const objectKeyString = 'vista:' + this.channelType.makeId(dataset.identifier, this.datum.channel_id);

            return openmct.objects.get(objectKeyString);
        });
    }

    getContextMenuActions() {
        return ['viewHistoricalData'];
    }
}
