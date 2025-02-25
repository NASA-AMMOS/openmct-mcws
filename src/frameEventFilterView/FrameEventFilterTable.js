import TelemetryTable from 'openmct.tables.TelemetryTable';

export default class FrameEventFilterTable extends TelemetryTable {
  requestDataFor() {
    return Promise.resolve([]);
  }
}
