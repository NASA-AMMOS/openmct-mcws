define([
    './ChannelTableRowCollection',
    './ChannelTableRow',
    'openmct.tables.TelemetryTable',
    'openmct.tables.TelemetryTableColumn',
    './EmptyChannelTableRow',
    './ObjectNameColumn'
], function (
    ChannelTableRowCollection,
    ChannelTableRow,
    TelemetryTable,
    TelemetryTableColumn,
    EmptyChannelTableRow,
    ObjectNameColumn
) {
    class ChannelTable extends TelemetryTable {
        constructor(domainObject, openmct) {
            super(domainObject, openmct);
            this.updateConfiguration = this.updateConfiguration.bind(this);
            this.reorder = this.reorder.bind(this);
            this.addDummyRowForObject = this.addDummyRowForObject.bind(this);

            this.configuration.on('change', this.updateConfiguration);
            this.objectNames = {};
        }

        initialize() {
            this.filterObserver = this.openmct.objects.observe(this.domainObject, 'configuration.filters', this.updateFilters);
            this.filters = this.domainObject.configuration && this.domainObject.configuration.filters;
            this.loadComposition();
            this.tableComposition.on('reorder', this.reorder);
        }

        createTableRowCollections() {
            this.tableRows = new ChannelTableRowCollection(this.openmct);

            let sortOptions = this.configuration.getConfiguration().sortOptions;

            //If no persisted sort order, default to sorting by time system, ascending.
            sortOptions = sortOptions || {
                key: this.openmct.time.timeSystem().key,
                direction: 'asc'
            };
    
            this.tableRows.sortBy(sortOptions);
            this.tableRows.on('resetRowsFromAllData', this.resetRowsFromAllData);
        }

        addTelemetryObject(telemetryObject) {
            super.addTelemetryObject(telemetryObject);
            this.addDummyRowForObject(telemetryObject);
        }

        addNameColumn(telemetryObject) {
            let nameColumn = new ObjectNameColumn(telemetryObject.name);
            this.configuration.addSingleColumnForObject(telemetryObject, nameColumn, 0);
        }

        addDummyRowForObject(object) {
            let objectKeyString = this.openmct.objects.makeKeyString(object.identifier);
            let columns = this.getColumnMapForObject(objectKeyString);
            let dummyRow = new EmptyChannelTableRow(columns, objectKeyString);

            this.tableRows.addRows([dummyRow]);
        }

        updateConfiguration(newConfiguration) {
            let cellFormatConfiguration = newConfiguration.cellFormat || {};
            this.tableRows.rows.forEach(row => row.updateRowConfiguration && row.updateRowConfiguration(cellFormatConfiguration[row.objectKeyString]));
            this.emit('refresh');
        }

        getTelemetryProcessor(keyString, columnMap, limitEvaluator) {
            return (telemetry) => {
                //Check that telemetry object has not been removed since telemetry was requested.
                if (!this.telemetryObjects[keyString]) {
                    return;
                }

                telemetry.forEach(datum => {
                    const row = this.createRow(datum, columnMap, keyString, limitEvaluator);

                    if (this.paused) {
                        this.delayedActions.push(this.tableRows.addOrUpdateRow.bind(this, row));
                    } else {
                        this.tableRows.addOrUpdateRow(row);
                    }
                });
            };
        }

        buildOptionsFromConfiguration(telemetryObject) {
            const requestOptions = super.buildOptionsFromConfiguration(telemetryObject);
            requestOptions.strategy = 'latest';
            requestOptions.size = 1;

            return requestOptions;
        }

        requestDataFor(telemetryObject) {
            this.incrementOutstandingRequests();
            let requestOptions = this.buildOptionsFromConfiguration(telemetryObject);
            requestOptions.strategy = 'latest';
            requestOptions.size = 1;

            return this.openmct.telemetry.request(telemetryObject, requestOptions)
                .then(telemetryData => {
                    let keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
                    let columnMap = this.getColumnMapForObject(keyString);
                    let limitEvaluator = this.openmct.telemetry.limitEvaluator(telemetryObject);
                    this.processHistoricalData(telemetryData, columnMap, keyString, limitEvaluator);
                }).finally(() => this.decrementOutstandingRequests());
        }

        processHistoricalData(telemetryData, columnMap, keyString, limitEvaluator) {
            let telemetryRows = telemetryData.map(datum => this.createRow(datum, columnMap, keyString, limitEvaluator));
            this.tableRows.addRows(telemetryRows);
        }

        processRealtimeDatum(datum, columnMap, keyString, limitEvaluator) {
            this.tableRows.addOne(this.createRow(datum, columnMap, keyString, limitEvaluator));
        }

        createColumn(metadatum) {
            return new TelemetryTableColumn(this.openmct, metadatum, {selectable: true});
        }

        createRow(datum, columnMap, keyString, limitEvaluator) {
            let cellFormatConfiguration = this.configuration.getConfiguration().cellFormat || {};
            return new ChannelTableRow(datum, columnMap, keyString, limitEvaluator, cellFormatConfiguration[keyString]);
        }

        reorder(reorderPlan) {
            this.tableRows.reorder(reorderPlan);
            this.emit('refresh');
        }

        destroy() {
            super.destroy();
            this.configuration.off('change', this.updateConfiguration);
            this.tableComposition.off('reorder', this.reorder);
        }
    }

    return ChannelTable;
});
