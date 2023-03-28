import TelemetryTable from 'openmct.tables.TelemetryTable';
import TelemetryTableRow from 'openmct.tables.TelemetryTableRow';

export default class BadFramesTelemetryTable extends TelemetryTable { 
    constructor(domainObject, openmct, metadata = []) {
        super(domainObject, openmct);

        this.metadata = metadata;
        this.data = [];
    }

    addTelemetryObject(telemetryObject) {
            this.addColumnsForObject(telemetryObject, true);

            this.emit('object-added', telemetryObject);
    }

    addColumnsForObject(telemetryObject) {
        this.metadata.forEach(metadatum => {
            let column = this.createColumn(metadatum);
            this.configuration.addSingleColumnForObject(telemetryObject, column);
        });
    }

    requestDataFor(telemetryObject) {
        this.keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
        this.columnMap = this.getColumnMapForObject(this.keyString);
        this.limitEvaluator = this.openmct.telemetry.limitEvaluator(telemetryObject);

        return Promise.resolve(this.data).then(telemetryData => {
            this.processHistoricalData(telemetryData, this.columnMap, this.keyString, this.limitEvaluator);
        });
    }

    processHistoricalData(telemetryData, columnMap, keyString, limitEvaluator) {
        let telemetryRows = telemetryData.map(datum => {
            return new TelemetryTableRow(datum, columnMap, keyString, limitEvaluator);
        });

        this.tableRows.addRows(telemetryRows);
    }

    addNewRow(datum) {
        const row = new TelemetryTableRow(
            datum,
            this.columnMap,
            this.keyString,
            this.limitEvaluator
        );

        this.tableRows.addRows([row]);
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
