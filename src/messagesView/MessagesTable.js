import TelemetryTable from 'openmct.tables.TelemetryTable';
export default class MessagesTable extends TelemetryTable {
  initialize() {
    this.filterObserver = this.openmct.objects.observe(
      this.domainObject,
      'configuration.filters',
      this.updateFilters
    );
    this.filters = this.domainObject.configuration && this.domainObject.configuration.filters;
    this.loadComposition();
  }
}
