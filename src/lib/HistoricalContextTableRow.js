import TelemetryTableRow from 'openmct.tables.TelemetryTableRow';

export default class HistoricalContextTableRow extends TelemetryTableRow {
  getContextMenuActions() {
    return ['viewHistoricalData'];
  }
}
