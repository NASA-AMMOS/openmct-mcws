/**
 * Format for SCLK values as 64 bit float.
 *
 * @implements {Format}
 */
class SCLKFloat64Format {
  constructor() {
    this.key = 'sclk.float64';
  }

  format(value) {
    return value && value.toString ? value.toString() : '';
  }

  parse(stringValue) {
    return parseFloat(stringValue);
  }

  validate(stringValue) {
    const floatValue = this.parse(stringValue);

    return !Number.isNaN(floatValue);
  }
}

export default SCLKFloat64Format;
