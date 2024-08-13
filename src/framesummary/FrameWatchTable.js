import TelemetryTable from 'openmct.tables.TelemetryTable';
import FrameWatchRowCollection from './FrameWatchRowCollection';
import FrameWatchRow from './FrameWatchRow';
import EncodingWatchRow from './encodingwatch/EncodingWatchRow';
import FrameWatchColumn from './FrameWatchColumn';
import { ENCODING_WATCH_TYPE, FRAME_WATCH_TYPE, config } from './config';
import Types from '../types/types.js';


export default class FrameWatchTable extends TelemetryTable {
    constructor(domainObject, openmct, options, type) {
        super(domainObject, openmct, options);

        this.type = type;
        this.config = config[this.type];
    }

    initialize() {
        if (this.isDatasetNode()) {
            this.addTelemetryObject(this.domainObject);
        } else {
            this.loadComposition(this.domainObject);
        }
    }

    createTableRowCollections() {
        this.tableRows = new FrameWatchRowCollection(this.openmct);

        let sortOptions = this.configuration.getConfiguration().sortOptions;

        sortOptions = sortOptions || {
            key: 'vc_type',
            direction: 'asc'
        };

        this.tableRows.sortBy(sortOptions);
    }

    isDatasetNode() {
        return this.domainObject.type === 'vista.frameSummary';
    }

    getTelemetryProcessor(keyString, columnMap, limitEvaluator) {
        return (telemetry) => {
            //Check that telemetry object has not been removed since telemetry was requested.
            if (!this.telemetryObjects[keyString]) {
                return;
            }

            let datum = telemetry[telemetry.length - 1];
            let telemetryRows = this.createRows(datum, columnMap, keyString, limitEvaluator);

            this.updateHeader(datum);
            this.tableRows.clear();

            if (this.paused) {
                this.delayedActions.push(this.tableRows.addRows.bind(this, telemetryRows, 'add'));
            } else {
                this.tableRows.addRows(telemetryRows, 'add');
            }
        };
    }

    requestDataFor(telemetryObject) {
        return Promise.resolve([]);
    }

    processRealtimeDatum(datum, columnMap, keyString, limitEvaluator) {
        this.updateHeader(datum);

        this.tableRows.clear();
        let summaryRows = this.createRows(datum, columnMap, keyString, limitEvaluator);
        this.tableRows.addRows(summaryRows);
    }

    addColumnsForObject(telemetryObject) {
        const objectKeyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);

        this.configuration.columns[objectKeyString] = this.config.columns
            .map(column => new FrameWatchColumn(column.key, column.title));
    }

    createRows(datum, columnMap, keyString, limitEvaluator) {
        return datum[this.config.summaryType].map((frameSummary) => {
            let row;
            const rowId = this.config.createRowId(frameSummary);
            
            let transformedRow = this.config.transformRow(frameSummary);

            if (this.type === ENCODING_WATCH_TYPE) {
                const frameEventType = Types.typeForKey('vista.frameEvent');
                row = new EncodingWatchRow(transformedRow, columnMap, keyString, limitEvaluator, rowId, frameEventType);
            } 
            
            if (this.type === FRAME_WATCH_TYPE) {
                row = new FrameWatchRow(transformedRow, columnMap, keyString, limitEvaluator, rowId);
            }

            return row;
        });
    }
 
    updateHeader(datum) {
        this.validFrames = datum.num_frames;
        this.invalidFrames = datum.bad_frame_count;
        this.idleFrames = datum.idle_frames;

        this.emit('update-header');
    }
}
