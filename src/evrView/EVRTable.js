import TelemetryTable from 'openmct.tables.TelemetryTable'
import EVRLevelIndicatorTableRow from './EVRLevelIndicatorTableRow'

export default class EVRTable extends TelemetryTable {
    constructor(domainObject, openmct) {
        super(domainObject, openmct);
    }

    initialize() {
        if (this.domainObject.type === 'vista.evrView') {
            this.filterObserver = this.openmct.objects.observe(
                this.domainObject,
                'configuration.filters',
                this.updateFilters
            );

            this.filters = this.domainObject.configuration?.filters;
            this.loadComposition();

            if (this.domainObject.configuration?.levels) {
                this.updateLevels();
            }

            this.levelsObserver = this.openmct.objects.observe(
                this.domainObject,
                'configuration.levels',
                this.updateLevels.bind(this)
            );
        } else {
            this.addTelemetryObject(this.domainObject);
        }
    }

    addNameColumn(telemetryObject, metadataValues) {
        const metadatum = metadataValues.find(m => m.key === 'name');
        const column = this.createColumn(metadatum);

        this.configuration.addSingleColumnForObject(telemetryObject, column);
    }

    getTelemetryProcessor(keyString, columnMap, limitEvaluator) {
        return (telemetry) => {
            //Check that telemetry object has not been removed since telemetry was requested.
            if (!this.telemetryObjects[keyString]) {
                return;
            }

            let telemetryRows = telemetry.map(datum => new EVRLevelIndicatorTableRow(datum, columnMap, keyString, limitEvaluator, this.levels));

            if (this.paused) {
                this.delayedActions.push(this.tableRows.addRows.bind(this, telemetryRows, 'add'));
            } else {
                this.tableRows.addRows(telemetryRows, 'add');
            }
        };
    }

    destroy() {
        super.destroy();

        if (this.levelsObserver) {
            this.levelsObserver();
        }
    }

    updateLevels() {
        this.levels = Object.keys(this.domainObject.configuration.levels)
            .filter(key => this.domainObject.configuration.levels[key]);
    }
}
