import CSV from 'comma-separated-values';
import {saveAs} from 'saveAs';

export default class ExportDataTask {
    /**
     * Exports telemetry data to CSV for a group of domain objects.
     * Used to support the "Export Data" action.
     * @see {vista/export.ExportDataAction}
     * @param {DomainObject[]} domainObjects the domain object for which
     *        telemetry data should be exported
     */
    constructor(openmct, filename, domainObjects) {
        this._openmct = openmct;
        this.filename = filename;
        this.domainObjects = domainObjects;
    }

    /**
     * Query for telemetry data and export it to CSV.
     * @returns {Promise} a promise which will resolve when the export is
     *          successfully completed, or be rejected if an error occurs
     */
    async invoke() {
        const headers = [];
        const headerSet = {};
        const requestTelemetry = async (domainObject) => {
            const telemetry = await this._openmct.telemetry.request(domainObject);

            return telemetry;
        };
        const pullHeaders = (dataArray) => {
            dataArray.forEach((data) => {
                const datum = data[0] || {};
                Object.keys(datum).forEach((key) => {
                    if (!headerSet[key]) {
                        headerSet[key] = true;
                        headers.push(key);
                    }
                });
            });

            return dataArray;
        };
        const exportAsCSV = (rows) => this.exportCSV(rows, {
            headers,
            filename: this.filename
        });
        const telemetry = await Promise.all(this.domainObjects.map(requestTelemetry));
        pullHeaders(telemetry);
        const allTelemetry = telemetry.flat();

        return exportAsCSV(allTelemetry);
    }

    exportCSV(rows, options) {
        let headers = (options && options.headers)
            || (Object.keys((rows[0] || {})).sort());
        let filename = `${(options && options.filename) || 'export'}.csv`;
        let csvText = new CSV(rows, { header: headers }).encode();
        let blob = new Blob([csvText], { type: "text/csv" });
        saveAs(blob, filename);
    }
}
