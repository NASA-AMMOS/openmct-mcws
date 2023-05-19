import TableRowCollection from 'openmct.tables.collections.TableRowCollection';

export default class FrameWatchRowCollection extends TableRowCollection {
    constructor(openmct) {
        super(openmct);

        this.createRowMapEntries = this.createRowMapEntries.bind(this);
        this.removeRowMapEntries = this.removeRowMapEntries.bind(this);
        this.rowMap = {};

        this.on('remove', this.removeRowMapEntries);
        this.on('add', this.createRowMapEntries);
    }

    createRowMapEntries(row) {
        this.rowMap[row.rowId] = row;
    }

    removeRowMapEntries(rows) {
        rows.forEach((row) => {
            delete this.rowMap[row.rowId];
        });
    }
}
