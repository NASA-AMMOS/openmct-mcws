import TelemetryTable from 'openmct.tables.TelemetryTable';
import PacketSummaryRowCollection from './PacketSummaryRowCollection';
import PacketSummaryRow from './PacketSummaryRow';

export default class PacketSummaryTable extends TelemetryTable {
    constructor(domainObject, openmct) {
        super(domainObject, openmct);
    }

    initialize() {
        if (this.isDatasetNode()) {
            this.addTelemetryObject(this.domainObject);
        } else {
            this.loadComposition(this.domainObject);
        }
    }

    createTableRowCollections() {
        this.tableRows = new PacketSummaryRowCollection(this.openmct);

        let sortOptions = this.configuration.getConfiguration().sortOptions;

        sortOptions = sortOptions || {
            key: 'id',
            direction: 'asc'
        };

        this.tableRows.sortBy(sortOptions);
        this.tableRows.on('update', () => {
            this.emit('refresh');
        });
    }

    isDatasetNode() {
        return this.domainObject.type === 'vista.packetSummaryEvents';
    }

    getTelemetryProcessor(keyString, columnMap, limitEvaluator) {
        return (telemetry) => {
            //Check that telemetry object has not been removed since telemetry was requested.
            if (!this.telemetryObjects[keyString]) {
                return;
            }

            telemetry.forEach(datum => {
                this.processRealtimeDatum(datum, columnMap, keyString, limitEvaluator);
            });
        };
    }

    requestDataFor(telemetryObject) {
        return Promise.resolve([]);
    }

    processRealtimeDatum(datum, columnMap, keyString, limitEvaluator) {
        const rowId = this.tableRows.createRowId(datum);
        datum.id = rowId;

        this.updateHeader(datum);

        this.tableRows.addOrUpdateRow(new PacketSummaryRow(datum, columnMap, keyString, limitEvaluator, rowId));
    }

    updateHeader(datum) {
        if (!this.last_ert || this.last_ert <= datum.last_ert_time && datum.from_sse === "false") {
            this.last_ert = datum.last_ert_time;
            this.fswValid = datum.num_valid_packets;
            this.fswInvalid = datum.num_invalid_packets;
            this.fswFill = datum.num_fill_packets;

            this.emit('update-header');
        }
    }
}
