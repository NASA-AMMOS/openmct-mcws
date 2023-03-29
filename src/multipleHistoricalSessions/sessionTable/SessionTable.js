import TelemetryTable from 'openmct.tables.TelemetryTable';
import TelemetryTableRow from 'openmct.tables.TelemetryTableRow';

export default class SessionTable extends TelemetryTable { 
    constructor(domainObject, openmct, metadata) {
        super(domainObject, openmct);

        this.metadata = metadata;
        this.data = [];
    }

    // TODO telemetry and tables should be separate concerns
    // SessionTables don't have traditional "telemetry" so don't load collections as a hack
    // we won't have to do this hack if tables broken down
    addTelemetryObject(telemetryObject) {
        this.addColumnsForObject(telemetryObject, true);

        const keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
        let requestOptions = this.buildOptionsFromConfiguration(telemetryObject);
        let columnMap = this.getColumnMapForObject(keyString);
        let limitEvaluator = this.openmct.telemetry.limitEvaluator(telemetryObject);

        const telemetryProcessor = this.getTelemetryProcessor(keyString, columnMap, limitEvaluator);
        const telemetryRemover = this.getTelemetryRemover();

        this.removeTelemetryCollection(keyString);

        this.telemetryCollections[keyString] = this.openmct.telemetry
            .requestCollection(telemetryObject, requestOptions);

        this.telemetryCollections[keyString].on('requestStarted', this.incrementOutstandingRequests);
        this.telemetryCollections[keyString].on('requestEnded', this.decrementOutstandingRequests);
        this.telemetryCollections[keyString].on('remove', telemetryRemover);
        this.telemetryCollections[keyString].on('add', telemetryProcessor);
        this.telemetryCollections[keyString].on('clear', this.clearData);
        // this.telemetryCollections[keyString].load();

        this.telemetryObjects[keyString] = {
            telemetryObject,
            keyString,
            requestOptions,
            columnMap,
            limitEvaluator
        };

        this.emit('object-added', telemetryObject);
    }

    addColumnsForObject(telemetryObject) {
        this.metadata.values.forEach(metadatum => {
            let column = this.createColumn(metadatum);
            this.configuration.addSingleColumnForObject(telemetryObject, column);
        });
    }

    requestDataFor(telemetryObject) {
        return Promise.resolve(this.data).then(telemetryData => {
            let keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
            let columnMap = this.getColumnMapForObject(keyString);
            let limitEvaluator = this.openmct.telemetry.limitEvaluator(telemetryObject);
            this.processHistoricalData(telemetryData, columnMap, keyString, limitEvaluator);
        });
    }

    processHistoricalData(telemetryData, columnMap, keyString, limitEvaluator) {
        let telemetryRows = telemetryData.map(datum => {
            let row = new TelemetryTableRow(datum, columnMap, keyString, limitEvaluator);

            if (datum.marked) {
                row.marked = true;
            }

            return row;
        });

        this.tableRows.addRows(telemetryRows);
        this.emit('historical-rows-processed');
    }

    resetRowsFromAllData() {
        let keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);
        let columnMap = this.getColumnMapForObject(keyString);
        let limitEvaluator = this.openmct.telemetry.limitEvaluator(this.domainObject);

        let rows = this.data.map(datum => {
            let row = new TelemetryTableRow(datum, columnMap, keyString, limitEvaluator);

            if (datum.marked) {
                row.marked = true;
            }

            return row;
        });

        this.tableRows.clearRowsFromTableAndFilter(rows);
    }

    clearAndUpdateData(data) {
        this.data = data;
        this.clearData();
        this.requestDataFor(this.domainObject);
    }

    destroy() {
        this.clearAndUpdateData([]);
    }

    extendsDestroy() {
        super.destroy();
    }
}
