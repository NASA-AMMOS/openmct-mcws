import TelemetryTable from 'openmct.tables.TelemetryTable';
import TelemetryTableRow from 'openmct.tables.TelemetryTableRow';
import mcws from 'services/mcws/mcws';

export default class DictionaryViewTable extends TelemetryTable { 
    constructor(domainObject, openmct, options, metadata = []) {
        super(domainObject, openmct, options);

        this.metadata = metadata;
        this.data = [];

        this.url = domainObject.dataTablePath;
        this.error = undefined;

        this.processData = this.processData.bind(this);
        this.processError = this.processError.bind(this);
    }

    // TODO telemetry and tables should be separate concerns
    // SessionTables don't have traditional "telemetry" so don't load collections as a hack
    // we won't have to do this hack if tables broken down
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
        return Promise.resolve(this.data).then(telemetryData => {
            let keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
            let columnMap = this.getColumnMapForObject(keyString);
            let limitEvaluator = this.openmct.telemetry.limitEvaluator(telemetryObject);

            this.processHistoricalData(telemetryData, columnMap, keyString, limitEvaluator);
        });
    }

    processHistoricalData(telemetryData, columnMap, keyString, limitEvaluator) {
        let telemetryRows = telemetryData.map(datum => {
            return new TelemetryTableRow(datum, columnMap, keyString, limitEvaluator);
        });

        this.tableRows.addRows(telemetryRows);
        this.emit('historical-rows-processed');
    }

    processData(data) {
        this.data = data;
        this.metadata = this.processHeaders(data[0])
        this.requestDataFor(this.domainObject);
        this.addColumnsForObject(this.domainObject);
    }

    processError(errorObject) {
        this.error = {
            statusText: errorObject.statusText,
            status: errorObject.status
        };
    }

    loadDictionary() {
        return mcws.dataTable(this.url).read()
            .then(this.processData, this.processError);
    }

    processHeaders(row) {
        return Object.keys(row).map((key => {
            return {
                name: key,
                key: key,
                source: key
            }
        }));
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
}
