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
        this.openmct = openmct;
        this.filename = filename;
        this.domainObjects = domainObjects;
    }

    /**
     * Query for telemetry data and export it to CSV.
     * @returns {Promise} a promise which will resolve when the export is
     *          successfully completed, or be rejected if an error occurs
     */
    async invoke() {
        const telemetryData = await this.fetchAllTelemetryData();
        const headers = this.extractHeaders(telemetryData);
        const allTelemetry = telemetryData.flat();

        return this.exportAsCSV(allTelemetry, headers);
    }

    async fetchAllTelemetryData() {
        return Promise.all(this.domainObjects.map(async (domainObject) => {
            return this.openmct.telemetry.request(domainObject, { strategy: 'comprehensive' });
        }));
    }

    extractHeaders(telemetryData) {
        const headerSet = new Set();
        telemetryData.forEach(data => {
            const datum = data[0] || {};
            Object.keys(datum).forEach(key => headerSet.add(key));
        });
        return Array.from(headerSet);
    }

    exportAsCSV(rows, headers) {
        const options = {
            headers: headers,
            filename: this.filename
        };
        return this.exportCSV(rows, options);
    }

    exportCSV(rows, options) {
        const headers = options.headers || Object.keys((rows[0] || {})).sort();
        const filename = `${options.filename || 'export'}.csv`;
        const csvText = new CSV(rows, { header: headers }).encode();
        const blob = new Blob([csvText], { type: "text/csv" });
        saveAs(blob, filename);
    }
}

