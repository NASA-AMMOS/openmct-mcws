import CopyableTelemetryTable from 'lib/CopyableTelemetryTable';
export default class CommandEventsTable extends CopyableTelemetryTable {
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
