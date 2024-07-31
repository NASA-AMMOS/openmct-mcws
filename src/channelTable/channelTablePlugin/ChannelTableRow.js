import HistoricalContextTableRow from 'lib/HistoricalContextTableRow';
import printj from 'printj';

export default class ChannelTableRow extends HistoricalContextTableRow {
  constructor(datum, columns, objectKeyString, limitEvaluator, rowFormatConfiguration) {
    super(datum, columns, objectKeyString, limitEvaluator);
    this.rowFormats = rowFormatConfiguration || {};
  }

  getFormattedValue(key) {
    if (this.rowFormats[key]) {
      return this.getCustomFormattedValue(this.datum[key], this.rowFormats[key]);
    } else {
      let column = this.columns[key];
      return column && column.getFormattedValue(this.datum[key]);
    }
  }

  getCustomFormattedValue(value, format) {
    return printj.sprintf(format, value);
  }

  updateRowConfiguration(rowFormatConfiguration) {
    this.rowFormats = rowFormatConfiguration || {};
  }
}
