define([
    'openmct.tables.TelemetryTable',
    './DataProductRow',
    './EMDColumn',
    './EMDPreviewColumn',
    './DATColumn',
    './TXTColumn',
    './DataProductRowCollection',
    'lodash'
], function (
    TelemetryTable,
    DataProductRow,
    EMDColumn,
    EMDPreviewColumn,
    DATColumn,
    TXTColumn,
    DataProductRowCollection,
    _
) {
    return class DataProductTable extends TelemetryTable {
        constructor(domainObject, openmct) {
            super(domainObject, openmct);
            
            this.setAutoClearTimeout = this.setAutoClearTimeout.bind(this);
            this.autoClearTimeoutObserver = this.openmct.objects.observe(this.domainObject, 
                'configuration.autoClearTimeout', this.setAutoClearTimeout);

            let autoClearTimeout = _.get(this.domainObject, 'configuration.autoClearTimeout');
            this.setAutoClearTimeout(autoClearTimeout);
        }

        initialize() {
            if (this.isDatasetNode()) {
                this.addTelemetryObject(this.domainObject);
            } else {
                this.loadComposition(this.domainObject);
            }
        }

        createTableRowCollections() {
            this.tableRows = new DataProductRowCollection.default(this.openmct);

            //Fetch any persisted default sort
            let sortOptions = this.configuration.getConfiguration().sortOptions;

            //If no persisted sort order, default to sorting by time system, ascending.
            sortOptions = sortOptions || {
                key: this.openmct.time.timeSystem().key,
                direction: 'asc'
            };
            this.tableRows.sortBy(sortOptions);
            this.tableRows.on('update', function () {
                this.emit('refresh');
            }, this);
        }

        clearPartial() {
            this.clearStatuses([DataProductRow.STATUS.PARTIAL, DataProductRow.STATUS.PARTIAL_CHECKSUM_FAIL]);
        }

        clearCompleted(olderThan) {
            this.clearStatuses([DataProductRow.STATUS.COMPLETE, DataProductRow.STATUS.COMPLETE_CHECKSUM_PASS, DataProductRow.STATUS.COMPLETE_NO_CHECKSUM], olderThan);
        }

        clearStatuses(statuses, olderThan) {
            let removed = [];
            let now = Date.now();

            for (let i = 0; i < this.tableRows.rows.length; i++) {
                let row = this.tableRows.rows[i];
                let shouldRemove = statuses.includes(row.datum[DataProductRow.STATUS.FIELD]);
                let timeSinceCompleted = now - row.timeCompleted;

                if (shouldRemove && (olderThan !== undefined && timeSinceCompleted < olderThan)) {
                    shouldRemove = false;
                }

                if (shouldRemove) {
                    this.tableRows.rows.splice(i, 1);
                    removed.push(row);
                    // Decrement index to ensure every element is visited after deletion
                    i--;
                }
            }
            if (removed.length > 0) {
                this.tableRows.emit('remove', removed);
            } 
        }

        isDatasetNode() {
            return this.domainObject.type === 'vista.dataProducts'
        }

        createColumn(metadatum) {
            switch (metadatum.key) {
                //Create custom column types with links for EMD, DAT, and TXT files
                case 'emd_url':
                    return new EMDColumn(this.openmct, metadatum);
                case 'emd_preview':
                    return new EMDPreviewColumn(this.openmct, metadatum);
                case 'dat_url':
                    return new DATColumn(this.openmct, metadatum);
                case 'txt_url':
                    return new TXTColumn(this.openmct, metadatum);
                //Prepend "Dvt" to time columns
                case 'scet':
                case 'sclk':
                case 'msl.sol':
                    let copyOfMetadatum = Object.assign({}, metadatum);
                    copyOfMetadatum.name = 'Dvt ' + copyOfMetadatum.name;
                    return super.createColumn(copyOfMetadatum);
            }

            return super.createColumn(metadatum);
        }

        getTelemetryProcessor(keyString, columnMap, limitEvaluator) {
            return (telemetry) => {
                //Check that telemetry object has not been removed since telemetry was requested.
                if (!this.telemetryObjects[keyString]) {
                    return;
                }

                telemetry.forEach(datum => {
                    const rowId = this.tableRows.createRowId(datum);
                    if (this.tableRows.contains(rowId)){
                        this.tableRows.update(rowId, datum);
                    } else {
                        this.tableRows.addRows(
                            [new DataProductRow(datum, columnMap, keyString, limitEvaluator, rowId)],
                            'add'
                        );
                    }
                });

                // TODO
                // if (this.paused) {
                //     this.delayedActions.push(this.tableRows.addRows.bind(this, telemetryRows, 'add'));
                // } else {
                //     this.tableRows.addRows(telemetryRows, 'add');
                // }

                if (this.autoClearTimeoutMS) {
                    this.clearCompleted(this.autoClearTimeoutMS);
                }
            };
        }

        getTelemetryRemover() {
            return (telemetry) => {
                // TODO
            };
        }

        setAutoClearTimeout(timeout) {
            if (timeout === undefined || timeout === '') {
                clearTimeout(this.autoClearTimeoutHandle);
            } else {
                this.autoClearTimeoutMS = timeout * 60 * 1000;
                this.setNextAutoClearTimeout();
            }
        }

        setNextAutoClearTimeout() {
            clearTimeout(this.autoClearTimeoutHandle);
            
            let now = Date.now();
            let wait = this.autoClearTimeoutMS;

            let earliestTimeCompleted = this.earliestTimeCompleted();

            if (earliestTimeCompleted != undefined) {
                let timeSinceEarliestCompleted = now - earliestTimeCompleted;
                wait = Math.max(0, this.autoClearTimeoutMS - timeSinceEarliestCompleted);
            }
            this.autoClearTimeoutHandle = setTimeout(() => {
                this.clearCompleted(this.autoClearTimeoutMS);
                this.setNextAutoClearTimeout();
            }, wait);
        }

        earliestTimeCompleted() {
            return this.tableRows.getRows()
                .filter(row => row.isComplete())
                .map(row => row.timeCompleted)
                .sort((a, b) => a - b)[0];
        }
    }
});