import TableRowCollection from 'openmct.tables.collections.TableRowCollection';

export default class FrameWatchRowCollection extends TableRowCollection {
    addRows(rows) {
        let rowsToAdd = this.filterRows(rows);
        let newRowsToAdd = [];
        
        rowsToAdd.forEach(rowToAdd => {
            const matchIndex = this.rows.find(row => row.rowId === rowToAdd.rowId)

            if (matchIndex !== undefined) {
                this.emit('remove', [this.rows[matchIndex]]);
                this.rows[matchIndex] = rowToAdd;
                this.emit('add', [this.rows[matchIndex]]);
            } else {
                newRowsToAdd.push(rowToAdd);
            }
        });

        if (newRowsToAdd.length > 0) {
            this.sortAndMergeRows(newRowsToAdd);
            this.emit('add', newRowsToAdd);
        }
    }
}
