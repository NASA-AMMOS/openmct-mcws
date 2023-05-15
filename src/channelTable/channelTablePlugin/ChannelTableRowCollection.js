define(
    [
        'lodash',
        'openmct.tables.collections.TableRowCollection',
        './EmptyChannelTableRow'

    ],
    function (
        _,
        TableRowCollection,
        EmptyChannelTableRow
    ) {

        class ChannelTableRowCollection extends TableRowCollection {
            constructor (openmct) {
                super();

                this.openmct = openmct;
                this.ladMap = new Map();
                this.timeColumn = openmct.time.timeSystem().key;
                this.addOrUpdateRow = this.addOrUpdateRow.bind(this);
            }

            addOrUpdateRow(row) {
                if (this.isLADRow(row)) {
                    this.removeRowsByObject(row.objectKeyString);
                    super.addRows([row], 'add');
                }
            }

            isLADRow(newRow) {
                const isStaleData = this.rows.some(row => 
                    row.objectKeyString === newRow.objectKeyString
                    && !row.isDummyRow
                    && row.datum[this.timeColumn] > newRow.datum[this.timeColumn]
                );

                return !isStaleData;
            }

            addOne (item) {
                if (item.isDummyRow) {
                    this.ladMap.set(item.objectKeyString, this.rows.length);
                    this.rows.push(item);
                    this.emit('add', item);
                    return true;
                }

                if (this.isNewerThanLAD(item)) {
                    let rowIndex = this.ladMap.get(item.objectKeyString);
                    let itemToReplace = this.rows[rowIndex];
                    this.rows[rowIndex] = item;
                    this.emit('remove', [itemToReplace]);
                    this.emit('add', [item]);
                    return true;
                }
                return false;
            }

            removeAllRowsForObject(objectKeyString) {
                super.removeAllRowsForObject(objectKeyString);
                this.rebuildLadMap();
            }

            rebuildLadMap() {
                this.ladMap.clear();
                this.rows.forEach((row, index) => {
                    this.ladMap.set(row.objectKeyString, index);
                });
            }

            reorder (reorderPlan) {
                let oldRows = this.rows.slice();
                reorderPlan.forEach(reorderEvent => {
                    let item = oldRows[reorderEvent.oldIndex];
                    this.rows[reorderEvent.newIndex] = item;
                    this.ladMap.set(item.objectKeyString, reorderEvent.newIndex);
                });
            }

            sortByTimeSystem(timeSystem) {
                this.timeColumn = timeSystem.key;
            }

            isNewerThanLAD(item) {
                let rowIndex = this.ladMap.get(item.objectKeyString);
                let latestRow = this.rows[rowIndex];
                let newerThanLatest = latestRow === undefined ||
                    item.datum[this.timeColumn] > latestRow.datum[this.timeColumn] ||
                    latestRow.isDummyRow;

                return !this.ladMap.has(item.objectKeyString) || newerThanLatest;
            }

            getRows() {
                return this.rows;
            }

            clear() {
                this.rows = this.rows.map(
                    row => new EmptyChannelTableRow(row.columns, row.objectKeyString)
                );
                this.rebuildLadMap();
            }

            destroy() {}
        }
    return ChannelTableRowCollection;
});
