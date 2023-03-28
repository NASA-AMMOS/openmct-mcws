import TableRowCollection from 'openmct.tables.collections.TableRowCollection';

export default class DataProductRowCollection extends TableRowCollection {
    constructor(openmct) {
        super(openmct);

        this.createRowMapEntries = this.createRowMapEntries.bind(this);
        this.removeRowMapEntries = this.removeRowMapEntries.bind(this);
        this.rowMap = {};

        this.on('remove', this.removeRowMapEntries);
        this.on('add', this.createRowMapEntries);
        this.on('filter', this.filter)
    }

    filter() {
        // TODO
    }

    createRowMapEntries(rows) {
        if (rows instanceof Array) {
            rows.forEach(row => {
                this.rowMap[row.rowId] = row;
            });
        } else {
            let row = rows;
            this.rowMap[row.rowId] = row;
        }
    }

    removeRowMapEntries(rows) {
        let rowId;
        rows.forEach((row) => {
            rowId = this.createRowId(row.datum);
            delete this.rowMap[rowId];    
        });
    }

    createRowId(datum) {
        let rowId = `${datum.session_id}`;
        // Use transaction id to uniquely identify row
        if (datum.transaction_id !== undefined) {
            rowId += `-${datum.transaction_id}`;
        } else if (datum.unique_name !== undefined) {
            //Otherwise use unique name
            rowId += `-${datum.session_host}-${datum.unique_name}`;
        } else {
            console.error('Unable to correlate data product row.');
        }
        return rowId;
    }

    contains(rowId) {
        return this.rowMap[rowId] !== undefined;
    }

    update(rowId, datum) {
        this.rowMap[rowId].update(datum);
    }

    destroy(){
        super.destroy();
        this.off('remove', this.removeRowMapEntries);
        this.off('add', this.createRowMapEntries);
    }
}