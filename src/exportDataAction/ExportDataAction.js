import ExportDataTask from './ExportDataTask';

/**
 * Implements the "Export Data" action, allowing data for Channels, EVRs,
 * or grouped containers of these to be exported as CSV using ES6 class syntax.
 *
 * @param {openmct} openmct instance
 * @memberof vista/export
 */
class ExportDataAction {
    constructor(openmct, validTypes) {
        this.name = 'Export Historical Data';
        this.key = 'vista.export';
        this.description = 'Export channel or EVR data as CSV';
        this.cssClass = 'icon-download';
        this.group = 'view';
        this.priority = 1;
        this.validTypes = validTypes;

        this._openmct = openmct;
    }

    appliesTo(objectPath) {
        const domainObject = objectPath[0];
        const isValidType = this.validTypes.includes(domainObject?.type);
        if (!isValidType) {
            return false;
        }

        const hasComposition = this._openmct.composition.get(domainObject) !== undefined;
        const hasHistoricalTelemetry = this._openmct.telemetry.isTelemetryObject(domainObject) && 
                !domainObject.telemetry.realtimeOnly;

        return hasHistoricalTelemetry || !hasHistoricalTelemetry && hasComposition;
    }

    invoke(objectPath) {
        const domainObject = objectPath[0];
        const progressDialog = this._openmct.notifications.progress('Exporting CSV', 'unknown');
        const runTask = (domainObjects) => new ExportDataTask(this._openmct, domainObject.name, domainObjects).invoke();
        const exportData = async (object) => {
            if (this._openmct.telemetry.isTelemetryObject(object)) {
                runTask([object]);
            } else {
                const compositionCollection = this._openmct.composition.get(object);
                const composition = await compositionCollection.load();
                runTask(composition);
            }
        }

        const success = (value) => {
            progressDialog.dismiss();
            return value;
        };

        const failure = (error) => {
            progressDialog.dismiss();
            console.error(error);
            this._openmct.notifications.error('Error exporting CSV');
        };

        return exportData(domainObject).then(success, failure);
    }
}

export default ExportDataAction;
