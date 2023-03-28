define([
    'openmct.tables.TelemetryTable'
], function (
    TelemetryTable
) {
    return class CommandEventsTable extends TelemetryTable {
        constructor(domainObject, openmct) {
            super(domainObject, openmct);
        }

        initialize() {
            this.filterObserver = this.openmct.objects.observe(
                this.domainObject,
                'configuration.filters',
                this.updateFilters
            );
            this.filters = this.domainObject.configuration && this.domainObject.configuration.filters;
            this.loadComposition();
        }
    };
});