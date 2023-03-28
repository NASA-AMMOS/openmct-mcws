define(['lib/HistoricalContextTableRow'], function (HistoricalContextTableRow) {
    class EmptyLADRow extends HistoricalContextTableRow {
        constructor(columns, objectKeyString) {
            super({}, columns, objectKeyString);
            this.isDummyRow = true;
            this.columns = columns;
            this.objectKeyString = objectKeyString;
            this.datum = Object.keys(columns).reduce((datum, column) => {
                datum[column] = undefined;
                return datum;
            }, {});
        }

        getFormattedDatum(headers) {
            return Object.keys(headers).reduce((formattedDatum, columnKey) => {
                formattedDatum[columnKey] = this.getFormattedValue(columnKey);
                return formattedDatum;
            }, {}); 
        }

        getFormattedValue(key) {
            if (key === 'vista-lad-name') {
                let column = this.columns[key];
                return column && column.getFormattedValue();
            } else if (this.columns[key] === undefined) {
                return '';
            } else {
                return this.datum[key] || '--'
            }
        }

        getRowClass() {
        }

        getCellLimitClasses() {
            return {};
        }
    }
    return EmptyLADRow;
});