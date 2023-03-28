define(
    [
        'lodash',
        'openmct.tables.collections.TableRowCollection'
    ],
    function (
        _,
        TableRowCollection
    ) {
        class AlarmsViewRowCollection extends TableRowCollection {
            constructor (openmct) {
                super(openmct);

                this.openmct = openmct;
                this.ladMap = new Map();
                this.sortBy(openmct.time.timeSystem());

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

            clearOutOfAlarmRows(timeout = 0){
                let now = Date.now();

                let rowsToDelete = Object.values(this.rows)
                    .filter(row => {
                        let outAlarmERT = this.getRowValue(row, 'out_alarm_ert');
                        if (outAlarmERT !== undefined && outAlarmERT !== '') {
                            let timeSinceOutAlarm = now - outAlarmERT;
                            return timeSinceOutAlarm >= timeout;
                        }
                        return false;
                    });
                rowsToDelete.forEach(row => {
                    let rowId = this.getRowId(row);
                    this.ladMap.delete(rowId);
                })
                this.remove(rowsToDelete);
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
                    .map(row => this.getRowValue(row, 'out_alarm_ert'))
                    .filter(outAlarmERT => outAlarmERT !== undefined && outAlarmERT !== '')
                    .sort((a, b) => a - b)[0];
            }

            getRowValue(row, key){
                let datumValue = row.datum[key];
                return datumValue && row.columns[key].formatter.parse(datumValue);
            }

            getRowId(row) {
                return `${row.datum.channel_id}#${row.datum.session_id}`;
            }

            addOne (row) {
                let rowId = this.getRowId(row);

                if (this.isNewerThanLAD(rowId, row)) {
                    let ladRow = this.ladMap.get(rowId);
                    if (ladRow) {
                        //Currently table does not support row updates, so for now remove and re-add.
                        this.remove([ladRow]);

                    }
                    this.ladMap.set(rowId, row);
                    return super.addOne(row);
                }
                return false;
            }

            addRows(rows, type = 'add') {
                const rowsToRemove = [];
                const rowsToAdd = [];

                rows.forEach(row => {
                    const rowId = this.getRowId(row);

                    if (this.isNewerThanLAD(rowId, row)) {
                        const ladRow = this.ladMap.get(rowId);
    
                        if (ladRow) {
                            rowsToRemove.push(ladRow);
                            rowsToAdd.push(row);
                        }

                        this.ladMap.set(rowId, row);
                    }
                });

                if (rowsToRemove.length > 0) {
                    this.removeRows(rowsToRemove);
                }

                if (rowsToAdd.length > 0) {
                    super.addRows(rowsToAdd, type);
                }
            }

            removeRows(rows) {
                this.rows = this.rows.filter(row => rows.indexOf(row) === -1);

                this.emit('remove', rows);
            }

            isNewerThanLAD(rowId, row) {
                let latestRow = this.ladMap.get(rowId);
                let newerThanLatest = (latestRow && 
                    row.datum[this.sortOptions.key] > latestRow.datum[this.sortOptions.key]);

                return !this.ladMap.has(rowId) || newerThanLatest;
            }
        }
    return AlarmsViewRowCollection;
});
