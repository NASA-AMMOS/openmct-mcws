/*global define*/

/**
 * @namespace vista/export
 */
define(['./ExportDataTask'], function (ExportDataTask) {
    "use strict";

    /**
     * Implements the "Export Data" action, allowing data for Channels, EVRs,
     * or grouped containers of these to be exported as CSV.
     *
     * @param {ExportService} exportService the service used to export as CSV
     * @param {openmct} openmct instance
     * @param {ActionContext} context the context in which the action is
     *        being performed
     * @implements {Action}
     * @constructor
     * @memberof vista/export
     */
    function ExportDataAction(exportService, openmct, context) {
        this.exportService = exportService;
        this.notificationService = openmct.notifications;
        this.overlayService = openmct.overlays;
        this.domainObject = context.domainObject;
    }

    ExportDataAction.prototype.perform = function () {
        var exportService = this.exportService,
            overlayService = this.overlayService,
            notificationService = this.notificationService,
            progressDialog = overlayService.progressDialog({
                progressText: "Exporting CSV",
                unknownProgress: true
            });

        function runTask(domainObjects) {
            return new ExportDataTask(exportService, domainObjects).perform();
        }

        function exportData(domainObject) {
            return domainObject.hasCapability('telemetry') ?
                runTask([domainObject]) :
                domainObject.useCapability('composition').then(runTask);
        }

        function success(value) {
            progressDialog.dismiss();
            return value;
        }

        function failure() {
            progressDialog.dismiss();
            notificationService.error("Error exporting CSV");
        }

        return exportData(this.domainObject).then(success, failure);
    };

    ExportDataAction.appliesTo = function (context) {
        var domainObject = context.domainObject;

        function delegatesTelemetry(domainObject) {
            var delegation = domainObject.getCapability('delegation');
            return (!!delegation) &&
                delegation.doesDelegateCapability('telemetry');
        }

        function hasHistoricalTelemetry(domainObject) {
            return domainObject.hasCapability('telemetry') && 
                    !domainObject.getModel().telemetry.realtimeOnly;
        }

        return (!!domainObject) &&
            (hasHistoricalTelemetry(domainObject) ||
                delegatesTelemetry(domainObject));
    };

    return ExportDataAction;
});
