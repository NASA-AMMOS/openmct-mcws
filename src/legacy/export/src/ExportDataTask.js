/*global define,Promise*/

define(['lodash'], function (_) {
    'use strict';

    /**
     * Exports telemetry data to CSV for a group of domain objects.
     * Used to support the "Export Data" action.
     * @see {vista/export.ExportDataAction}
     * @param {ExportService} exportService the service used to export as CSV
     * @param {DomainObject[]} domainObjects the domain object for which
     *        telemetry data should be exported
     * @constructor
     * @memberof vista/export
     */
    function ExportDataTask(exportService, domainObjects) {
        this.exportService = exportService;
        this.domainObjects = domainObjects;
    }

    /**
     * Query for telemetry data and export it to CSV.
     * @returns {Promise} a promise which will resolve when the export is
     *          successfully completed, or be rejected if an error occurs
     */
    ExportDataTask.prototype.perform = function () {
        var headers = [],
            headerSet = {},
            exportService = this.exportService;

        function issueRequest(domainObject) {
            var telemetry = domainObject.getCapability('telemetry');
            return telemetry ?
                telemetry.requestData({ strategy: 'comprehensive' }) :
                undefined;
        }

        function toRows(telemetrySeries) {
            return telemetrySeries.getData();
        }

        function pullHeaders(dataArray) {
            dataArray.forEach(function (data) {
                // Assume each series is internally consistent w.r.t.
                // contained properties; just look at properties from
                // first datum in each series.
                var datum = data[0] || {};
                Object.keys(datum).forEach(function (key) {
                    if (!headerSet[key]) {
                        headerSet[key] = true;
                        headers.push(key);
                    }
                });
            });

            return dataArray;
        }

        function exportAsCSV(rows) {
            return exportService.exportCSV(rows, { headers: headers });
        }

        return Promise.all(this.domainObjects.map(issueRequest))
            .then(_.filter)
            .then(_.partial(_.map, _, toRows))
            .then(pullHeaders)
            .then(_.flatten)
            .then(exportAsCSV);
    };

    return ExportDataTask;
});
