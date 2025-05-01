import TelemetryTableConfiguration from 'openmct.tables.TelemetryTableConfiguration';
import { config } from './config';
import FrameWatchColumn from './FrameWatchColumn';

export default class FrameWatchTableConfiguration extends TelemetryTableConfiguration {
  constructor(domainObject, openmct, options, type) {
    super(domainObject, openmct, options);

    this.config = config[type];
    this.columns = this.config.columns.map(
      (column) => new FrameWatchColumn(column.key, column.title)
    );
  }

  addSingleColumnForObject(telemetryObject, column, position) {
    /**
     * override with no-op
     * we are adding columns manually in table configuration
     * and in table view
     */
  }
}
