import TelemetryTable from 'openmct.tables.TelemetryTable';
import CopyableTelemetryTableRow from './CopyableTelemetryTableRow.js';

export default class CopyableTelemetryTable extends TelemetryTable {
  getTelemetryProcessor(keyString, columnMap, limitEvaluator) {
    return (telemetry) => {
      //Check that telemetry object has not been removed since telemetry was requested.
      if (!this.telemetryObjects[keyString]) {
        return;
      }

      const metadataValue = this.openmct.telemetry
        .getMetadata(this.telemetryObjects[keyString].telemetryObject)
        .getUseToUpdateInPlaceValue();

      let telemetryRows = telemetry.map(
        (datum) =>
          new CopyableTelemetryTableRow(
            datum,
            columnMap,
            keyString,
            limitEvaluator,
            metadataValue?.key
          )
      );

      if (this.paused) {
        this.delayedActions.push(this.tableRows.addRows.bind(this, telemetryRows, 'add'));
      } else {
        this.tableRows.addRows(telemetryRows);
      }
    };
  }

  // will pull all necessary information for all existing bounded telemetry
  // and pass to table row collection to reset without making any new requests
  // triggered by filtering
  resetRowsFromAllData() {
    let allRows = [];

    Object.keys(this.telemetryCollections).forEach((keyString) => {
      let { columnMap, limitEvaluator } = this.telemetryObjects[keyString];

      const metadataValue = this.openmct.telemetry
        .getMetadata(this.telemetryObjects[keyString].telemetryObject)
        .getUseToUpdateInPlaceValue();

      this.telemetryCollections[keyString].getAll().forEach((datum) => {
        allRows.push(
          new CopyableTelemetryTableRow(
            datum,
            columnMap,
            keyString,
            limitEvaluator,
            metadataValue?.key
          )
        );
      });
    });

    this.tableRows.clearRowsFromTableAndFilter(allRows);
  }
}
