import TelemetryTable from 'openmct.tables.TelemetryTable'

export default class FrameEventFilterTable extends TelemetryTable {
    constructor(domainObject, openmct) {
        super(domainObject, openmct);
    }

    requestDataFor() {
        return Promise.resolve([]);
    }
}
