/**
 * Format embedded JavaScript objects as JSON strings for debugging
 *
 * @implements {Format}
 */
class JSONStringFormat {
  constructor() {
    this.key = 'jsonString';
  }

  format(value) {
    return JSON.stringify(value);
  }

  parse(stringValue) {
    if (typeof stringValue === 'string') {
      return JSON.parse(stringValue);
    } else {
      return stringValue;
    }
  }

  validate(stringValue) {
    try {
      JSON.parse(stringValue);
      return true;
    } catch (error) {
      console.error('Failed to parse %s', stringValue, error);
      return false;
    }
  }
}

export default JSONStringFormat;
