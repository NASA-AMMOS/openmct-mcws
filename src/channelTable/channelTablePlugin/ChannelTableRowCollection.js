import TableRowCollection from 'openmct.tables.collections.TableRowCollection';
import EmptyChannelTableRow from './EmptyChannelTableRow.js';
export default class ChannelTableRowCollection extends TableRowCollection {
  constructor(openmct) {
    super();

    this.openmct = openmct;
    this.ladMap = new Map();
    this.timeColumn = openmct.time.timeSystem().key;
    this.addOrUpdateRow = this.addOrUpdateRow.bind(this);
  }

  addOrUpdateRow(row) {
    if (this.isLADRow(row)) {
      this.addRows([row]);
    }
  }

  isLADRow(newRow) {
    const isStaleData = this.rows.some(
      (row) =>
        row.objectKeyString === newRow.objectKeyString &&
        !row.isDummyRow &&
        row.datum[this.timeColumn] > newRow.datum[this.timeColumn]
    );

    return !isStaleData;
  }

  addOne(item) {
    if (item.isDummyRow) {
      this.ladMap.set(item.objectKeyString, this.rows.length);
      this.rows.push(item);
      this.emit('add', item);
      return true;
    }

    if (this.isNewerThanLAD(item)) {
      let rowIndex = this.ladMap.get(item.objectKeyString);
      this.rows[rowIndex] = item;
      this.removeExistingByKeyString(item.objectKeyString);
      this.emit('add', [item]);
      return true;
    }
    return false;
  }

  addRows(rows) {
    let rowsToAdd = this.filterRows(rows);

    if (rowsToAdd.length > 0) {
      rowsToAdd.forEach(this.addOne.bind(this));
      this.emit('add', rowsToAdd);
    }
  }

  removeAllRowsForObject(objectKeyString) {
    super.removeAllRowsForObject(objectKeyString);
    this.rebuildLadMap();
  }

  removeExistingByKeyString(keyString) {
    let removed = [];

    this.rows.forEach((row) => {
      if (row.objectKeyString === keyString) {
        removed.push(row);

        return false;
      } else {
        return true;
      }
    });

    this.emit('remove', removed);
  }

  rebuildLadMap() {
    this.ladMap.clear();
    this.rows.forEach((row, index) => {
      this.ladMap.set(row.objectKeyString, index);
    });
  }

  reorder(reorderPlan) {
    let oldRows = this.rows.slice();
    reorderPlan.forEach((reorderEvent) => {
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
    let newerThanLatest =
      latestRow === undefined ||
      item.datum[this.timeColumn] > latestRow.datum[this.timeColumn] ||
      latestRow.isDummyRow;

    return !this.ladMap.has(item.objectKeyString) || newerThanLatest;
  }

  getRows() {
    return this.rows;
  }

  clear() {
    this.rows = this.rows.map((row) => new EmptyChannelTableRow(row.columns, row.objectKeyString));
    this.rebuildLadMap();
  }

  destroy() {}
}
