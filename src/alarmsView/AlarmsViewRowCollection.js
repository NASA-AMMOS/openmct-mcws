import TableRowCollection from 'openmct.tables.collections.TableRowCollection';

export default class AlarmsViewRowCollection extends TableRowCollection {
  constructor() {
    super();

    this.setAutoClearTimeout = this.setAutoClearTimeout.bind(this);
  }

  setAutoClearTimeout(timeout) {
    if (timeout === undefined || timeout === '') {
      clearTimeout(this.autoClearTimeoutHandle);
    } else {
      this.autoClearTimeoutMS = timeout * 60 * 1000;
      this.setNextAutoClearTimeout();
    }
  }

  clearOutOfAlarmRows(timeout = 0) {
    const removedRows = [];
    const now = Date.now();

    this.rows = this.rows.filter((row) => {
      const outAlarmERT = this.getRowValue(row, 'out_alarm_ert');

      if (outAlarmERT === undefined || outAlarmERT === '') {
        return true;
      }

      const timeSinceOutAlarm = now - outAlarmERT;
      if (timeSinceOutAlarm >= timeout) {
        removedRows.push(row);

        return false;
      }

      return true;
    });

    if (removedRows.length) {
      this.emit('remove', removedRows);
    }
  }

  setNextAutoClearTimeout() {
    clearTimeout(this.autoClearTimeoutHandle);

    let now = Date.now();
    let wait = this.autoClearTimeoutMS;

    let earliestOutAlarmTime = this.earliestOutAlarmTime();

    if (earliestOutAlarmTime != undefined) {
      let timeSinceOutAlarm = now - earliestOutAlarmTime;
      wait = Math.max(0, this.autoClearTimeoutMS - timeSinceOutAlarm);
    }
    this.autoClearTimeoutHandle = setTimeout(() => {
      this.clearOutOfAlarmRows(this.autoClearTimeoutMS);
      this.setNextAutoClearTimeout();
    }, wait);
  }

  earliestOutAlarmTime() {
    return Object.values(this.rows)
      .map((row) => this.getRowValue(row, 'out_alarm_ert'))
      .filter((outAlarmERT) => outAlarmERT !== undefined && outAlarmERT !== '')
      .sort((a, b) => a - b)[0];
  }

  getRowValue(row, key) {
    let datumValue = row.datum[key];
    return datumValue && row.columns[key].formatter.parse(datumValue);
  }

  getRowId(row) {
    return `${row.datum.channel_id}#${row.datum.session_id}`;
  }

  addRows(rows) {
    let rowsToAdd = this.filterRows(rows);
    let newRowsToAdd = [];

    rowsToAdd.forEach((rowToAdd) => {
      const matchIndex = this.rows.findIndex((row) => row.getRowId() === rowToAdd.getRowId());

      if (matchIndex === -1) {
        newRowsToAdd.push(rowToAdd);
      } else {
        const ladRow = this.rows[matchIndex];
        if (this.isNewerThanLAD(rowToAdd, ladRow)) {
          this.emit('remove', ladRow);
          this.rows[matchIndex] = rowToAdd;
          this.emit('add', [rowToAdd]);
        }
      }
    });

    if (newRowsToAdd.length > 0) {
      this.sortAndMergeRows(newRowsToAdd);
      this.emit('add', newRowsToAdd);
    }
  }

  isNewerThanLAD(row, ladRow) {
    if (ladRow === undefined) {
      return true;
    }

    return row.datum[this.sortOptions.key] > ladRow.datum[this.sortOptions.key];
  }

  removeRows(rows) {
    this.rows = this.rows.filter((row) => rows.indexOf(row) === -1);

    this.emit('remove', rows);
  }
}
