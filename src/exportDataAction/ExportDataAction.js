import ExportDataTask from './ExportDataTask';
import SessionService from 'services/session/SessionService';
import { formatNumberSequence } from 'ommUtils/strings';

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
    this.sessionService = SessionService();

    this.openmct = openmct;
  }

  appliesTo(objectPath) {
    const domainObject = objectPath[0];

    if (this.isValidType(domainObject)) {
      return true;
    }

    return false;
  }

  async invoke(objectPath) {
    const domainObject = objectPath[0];
    const progressDialog = this.openmct.notifications.progress('Exporting CSV', 'unknown');

    try {
      await this.exportData(domainObject);
    } catch (error) {
      console.error(error);
      this.openmct.notifications.error('Error exporting CSV');
    } finally {
      progressDialog.dismiss();
    }
  }

  async exportData(domainObject) {
    if (this.hasHistoricalTelemetry(domainObject)) {
      await this.runExportTask(domainObject.name, [domainObject]);
    } else {
      await this.exportCompositionData(domainObject);
    }
  }

  async exportCompositionData(domainObject) {
    const compositionCollection = this.openmct.composition.get(domainObject);
    const composition = await compositionCollection.load();
    const filteredComposition = composition.filter(
      (obj) => this.isValidType(obj) && this.hasHistoricalTelemetry(obj)
    );

    if (filteredComposition.length > 0) {
      await this.runExportTask(domainObject.name, filteredComposition);
    } else {
      this.openmct.notifications.info('No historical data to export');
    }
  }

  historicalFilterString(sessionFilter) {
    let filterString = formatNumberSequence(sessionFilter.numbers);

    filterString = filterString.replaceAll('...', '-');
    filterString = filterString.replaceAll(', ', '_');

    return `${sessionFilter.host}_${filterString}`;
  }

  runExportTask(name, domainObjects) {
    let filename = name;
    const sessionFilter = this.sessionService.getHistoricalSessionFilter();

    if (sessionFilter) {
      filename = `${filename} - ${this.historicalFilterString(sessionFilter)}`;
    }

    return new ExportDataTask(this.openmct, filename, domainObjects).invoke();
  }

  isValidType(domainObject) {
    return this.validTypes.includes(domainObject?.type);
  }

  hasHistoricalTelemetry(domainObject) {
    return (
      this.openmct.telemetry.isTelemetryObject(domainObject) && !domainObject.telemetry.realtimeOnly
    );
  }
}

export default ExportDataAction;
