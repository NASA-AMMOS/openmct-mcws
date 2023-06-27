import _ from 'lodash';
import TelemetryTable from 'openmct.tables.TelemetryTable';
import AlarmsViewRowCollection from './AlarmsViewRowCollection';
import AlarmsViewHistoricalContextTableRow from './AlarmsViewHistoricalContextTableRow';
import Types from 'types/types';


export default class AlarmsTable extends TelemetryTable {
    constructor(domainObject, openmct){
        super(domainObject, openmct);

        this.channelType = Types.typeForKey('vista.channel');
    }
    initialize() {
        if (this.domainObject.type === 'vista.alarmMessageStream') {
            this.addTelemetryObject(this.domainObject);
        } else {
            this.filterObserver = this.openmct.objects.observe(this.domainObject, 'configuration.filters', this.updateFilters);
            this.filters = this.domainObject.configuration && this.domainObject.configuration.filters;
            this.loadComposition(this.domainObject);
        }
    }

    getTelemetryProcessor(keyString, columnMap, limitEvaluator) {
        return (telemetry) => {
            //Check that telemetry object has not been removed since telemetry was requested.
            if (!this.telemetryObjects[keyString]) {
                return;
            }

            let telemetryRows = telemetry.map(datum => {
                return new AlarmsViewHistoricalContextTableRow(datum, columnMap, keyString, limitEvaluator, this.channelType)
            });

            if (this.paused) {
                this.delayedActions.push(this.tableRows.addRows.bind(this, telemetryRows, 'add'));
            } else {
                this.tableRows.addRows(telemetryRows, 'add');
            }

            if (this.autoClearTimeoutMS) {
                this.clearCompleted(this.autoClearTimeoutMS);
            }
        };
    }

    processRealtimeDatum(datum, columnMap, keyString, limitEvaluator) {
        this.tableRows.add(new AlarmsViewHistoricalContextTableRow(datum, columnMap, keyString, limitEvaluator, this.channelType));
    }

    createTableRowCollections() {
        this.tableRows = new AlarmsViewRowCollection();

        //Fetch any persisted default sort
        let sortOptions = this.configuration.getConfiguration().sortOptions;

        //If no persisted sort order, default to sorting by time system, ascending.
        sortOptions = sortOptions || {
            key: this.openmct.time.timeSystem().key,
            direction: 'asc'
        };

        this.tableRows.sortBy(sortOptions);
        this.tableRows.on('resetRowsFromAllData', this.resetRowsFromAllData);
        

        this.autoClearTimeoutObserver = this.openmct.objects.observe(this.domainObject, 
            'configuration.autoClearTimeout', this.tableRows.setAutoClearTimeout);

        let autoClearTimeout = _.get(this.domainObject, 'configuration.autoClearTimeout');
        this.tableRows.setAutoClearTimeout(autoClearTimeout);
    }

    clearOutOfAlarmRows(){
        this.tableRows.clearOutOfAlarmRows();
    }

    requestDataFor() {
        return Promise.resolve([]);
    }

    destroy() {
        super.destroy();
        if (this.autoClearTimeoutObserver) {
            this.autoClearTimeoutObserver();
        }
    }
}
