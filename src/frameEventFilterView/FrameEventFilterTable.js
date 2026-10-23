import CopyableTelemetryTable from 'lib/CopyableTelemetryTable';

export default class FrameEventFilterTable extends CopyableTelemetryTable {
  requestDataFor() {
    return Promise.resolve([]);
  }
}
