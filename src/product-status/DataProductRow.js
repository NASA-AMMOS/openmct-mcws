define([
    'openmct.tables.TelemetryTableRow'
], function (TelemetryTableRow) {
    const PARTS_RECEIVED_FIELD = 'parts_received';
    const CREATION_TIME_FIELD = 'creation_time';
    const RECORD_TYPE_FIELD = 'record_type';
    const TOTAL_PARTS_FIELD = 'total_parts';

    const PRODUCT_STARTED_RECORD_TYPE = 'PRODUCT_STARTED';
    const COMPLETE_PRODUCT_RECORD_TYPE = 'COMPLETE_PRODUCT';
    const PRODUCT_PART_RECEIVED_RECORD_TYPE = 'PRODUCT_PART_RECEIVED';
    
    const PRODUCT_STATUS_MISSING_KEYS = ['ert','scet', 'sclk', 'lst', 'unique_name', 'creation_time', 'version', 
        'seq_id', 'dvt_coarse', 'dvt_fine', 'seq_version', 'checksum', 'file_size', 'command_number', 'ground_status'];

    const STATUS_CONSTANTS = {
        FIELD: 'ground_status',
        COMPLETE: 'COMPLETE',
        COMPLETE_NO_CHECKSUM: 'COMPLETE_NO_CHECKSUM',
        COMPLETE_CHECKSUM_PASS: 'COMPLETE_CHECKSUM_PASS',
        PARTIAL: 'PARTIAL',
        PARTIAL_CHECKSUM_FAIL: 'PARTIAL_CHECKSUM_FAIL'
    }

    const STATUS_MAP = {};
    STATUS_MAP[STATUS_CONSTANTS.COMPLETE] = 's-status--complete';
    STATUS_MAP[STATUS_CONSTANTS.COMPLETE_CHECKSUM_PASS] = 's-status--complete';
    STATUS_MAP[STATUS_CONSTANTS.COMPLETE_NO_CHECKSUM] = 's-status--complete';
    STATUS_MAP[STATUS_CONSTANTS.PARTIAL] = 's-status--partial';
    STATUS_MAP[STATUS_CONSTANTS.PARTIAL_CHECKSUM_FAIL] = 's-status--partial';
    
    class DataProductRow extends TelemetryTableRow {
        constructor(datum, columns, objectKeyString, limitEvaluator, rowId) {
            super(datum, columns, objectKeyString, limitEvaluator);

            this.datum[PARTS_RECEIVED_FIELD] = '--';
            
            this.rowId = rowId;

            if (this.isComplete()) {
                let creationTimeColumn = this.columns[CREATION_TIME_FIELD];
                this.timeCompleted = creationTimeColumn.formatter.parse(creationTimeColumn.getRawValue(datum));

                if (!isNaN(this.datum[TOTAL_PARTS_FIELD])) {
                    this.datum[PARTS_RECEIVED_FIELD] = parseInt(this.datum[TOTAL_PARTS_FIELD]);
                }
            } else if (upper(datum[RECORD_TYPE_FIELD]) === PRODUCT_STARTED_RECORD_TYPE) {
                this.datum[PARTS_RECEIVED_FIELD] = 0;
            }
        }
        getRowClass() {
            let status = upper(this.datum[STATUS_CONSTANTS.FIELD] || '');
            return STATUS_MAP[status];
        }
        getFormattedValue(key) {
            if (upper(this.datum[RECORD_TYPE_FIELD]) === PRODUCT_STARTED_RECORD_TYPE && 
                PRODUCT_STATUS_MISSING_KEYS.includes(key)) {
                    return '';
            } else {
                return super.getFormattedValue(key);
            }
        }

        update(incomingDatum) {
            incomingDatum[PARTS_RECEIVED_FIELD] = '--';

            // If message is a "part received" message, then increment the part count UNLESS this row is already 
            // complete. Parts messages can be received out of order.
            if (this.isPartReceived(incomingDatum) &&
                !this.isComplete() &&
                !isNaN(this.datum[PARTS_RECEIVED_FIELD])) {
                incomingDatum[PARTS_RECEIVED_FIELD] = this.datum[PARTS_RECEIVED_FIELD] + 1;
            }

            // If the incoming message is a "complete" message then always use the total parts as the total value.
            if (this.isComplete(incomingDatum)) {
                incomingDatum[PARTS_RECEIVED_FIELD] = parseInt(incomingDatum[TOTAL_PARTS_FIELD]);
            }
            // If the current datum for this row is incomplete, then always replace the values with the latest data
            // UNLESS the incoming datum is complete - it might be a newer version of the same data product.
            if (!this.isComplete() || this.isComplete(incomingDatum)) {
                this.datum = incomingDatum;
            }

            if (this.isComplete()) {
                this.timeCompleted = Date.now();
            }
        }
        isComplete(datum = this.datum) {
            return upper(datum[STATUS_CONSTANTS.FIELD]).indexOf(STATUS_CONSTANTS.COMPLETE) === 0 ||
                upper(datum[STATUS_CONSTANTS.FIELD]).indexOf(STATUS_CONSTANTS.COMPLETE_NO_CHECKSUM) === 0 ||
                upper(datum[STATUS_CONSTANTS.FIELD]).indexOf(STATUS_CONSTANTS.COMPLETE_CHECKSUM_PASS) === 0;
        }
        isPartReceived(datum = this.datum) {
            return upper(datum[RECORD_TYPE_FIELD]).indexOf(PRODUCT_PART_RECEIVED_RECORD_TYPE) === 0;
        }
        isPartial(datum = this.datum) {
            return upper(datum[STATUS_CONSTANTS.FIELD]).indexOf(STATUS_CONSTANTS.PARTIAL) === 0;
        }
    }

    function upper(string) {
        return ('' + string).toUpperCase();
    }

    DataProductRow.STATUS = STATUS_CONSTANTS;

    return DataProductRow;
});
