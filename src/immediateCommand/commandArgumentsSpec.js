import {
  buildCommandString,
  defaultArgumentValues,
  validateArgument,
  validateCommandArguments
} from './commandArguments.js';

describe('commandArguments', () => {
  const enumMap = {
    ClearMode: {
      values: [
        { symbol: 'CLEAR_A', value: 0 },
        { symbol: 'CLEAR_ALL', value: 1 }
      ]
    }
  };
  const modeArgument = {
    name: 'mode',
    arg_type: 'enum',
    enum_name: 'ClearMode',
    default_value: 'CLEAR_A',
    description: 'Which memory to clear'
  };
  const forceArgument = {
    name: 'force',
    arg_type: 'boolean',
    default_value: null,
    description: 'Bypass safety checks',
    format: { true_str: 'TRUE', false_str: 'FALSE' }
  };
  const gainArgument = {
    name: 'gain',
    arg_type: 'float',
    default_value: 2.5,
    range: { min: 0, max: 10 },
    units: 'dB'
  };
  const retriesArgument = {
    name: 'retries',
    arg_type: 'unsigned',
    default_value: null,
    range: { min: 0, max: 5 }
  };
  const codeArgument = {
    name: 'code',
    arg_type: 'var_string',
    default_value: null,
    valid_regex: '[0-9a-fA-F]{4,}'
  };
  const setModeCommand = {
    stem: 'FSW_SET_MODE',
    arguments: [modeArgument, forceArgument]
  };

  describe('validateArgument', () => {
    it('accepts a missing value when a default exists', () => {
      expect(validateArgument(gainArgument, '', enumMap)).toBe(null);
      expect(validateArgument(gainArgument, undefined, enumMap)).toBe(null);
    });

    it('requires a missing value without a default', () => {
      expect(validateArgument(retriesArgument, '', enumMap)).toBe('Value required');
    });

    it('validates numerics and ranges', () => {
      expect(validateArgument(gainArgument, 'abc', enumMap)).toBe('Must be a number');
      expect(validateArgument(gainArgument, '-1', enumMap)).toBe('Must be >= 0');
      expect(validateArgument(gainArgument, '11', enumMap)).toBe('Must be <= 10');
      expect(validateArgument(gainArgument, '7.5', enumMap)).toBe(null);
    });

    it('requires integers for integer types', () => {
      expect(validateArgument(retriesArgument, '2.5', enumMap)).toBe('Must be an integer');
      expect(validateArgument(retriesArgument, '3', enumMap)).toBe(null);
    });

    it('validates booleans in boolean and string forms', () => {
      expect(validateArgument(forceArgument, true, enumMap)).toBe(null);
      expect(validateArgument(forceArgument, 'FALSE', enumMap)).toBe(null);
      expect(validateArgument(forceArgument, 'true', enumMap)).toBe(null);
      expect(validateArgument(forceArgument, 'maybe', enumMap)).toBe(
        'Must be a boolean value'
      );
    });

    it('validates enums by symbol or numeric value', () => {
      expect(validateArgument(modeArgument, 'CLEAR_ALL', enumMap)).toBe(null);
      expect(validateArgument(modeArgument, '1', enumMap)).toBe(null);
      expect(validateArgument(modeArgument, 'CLEAR_X', enumMap)).toBe(
        'Must be one of: CLEAR_A, CLEAR_ALL'
      );
    });

    it('skips enum checks without the named enum', () => {
      expect(validateArgument(modeArgument, 'ANYTHING', {})).toBe(null);
    });

    it('validates regex patterns', () => {
      expect(validateArgument(codeArgument, 'AB12', enumMap)).toBe(null);
      expect(validateArgument(codeArgument, 'nope', enumMap)).toBe('Invalid format');
    });
  });

  describe('validateCommandArguments', () => {
    it('passes valid input and collects per-argument errors', () => {
      expect(
        validateCommandArguments(setModeCommand, { mode: 'CLEAR_A', force: 'TRUE' }, enumMap)
      ).toEqual({ valid: true, errors: {} });

      const result = validateCommandArguments(
        setModeCommand,
        { mode: 'CLEAR_X', force: 'maybe' },
        enumMap
      );

      expect(result.valid).toBe(false);
      expect(Object.keys(result.errors)).toEqual(['mode', 'force']);
    });

    it('passes commands without arguments', () => {
      expect(validateCommandArguments({ stem: 'HDW_POWER_ON' }, {})).toEqual({
        valid: true,
        errors: {}
      });
    });
  });

  describe('defaultArgumentValues', () => {
    it('picks non-null defaults', () => {
      expect(
        defaultArgumentValues({
          arguments: [modeArgument, forceArgument, gainArgument]
        })
      ).toEqual({ mode: 'CLEAR_A', gain: 2.5 });
    });
  });

  describe('buildCommandString', () => {
    it('joins positional values in argument order', () => {
      expect(
        buildCommandString('FSW_SET_MODE', setModeCommand, {
          mode: 'CLEAR_ALL',
          force: 'TRUE'
        })
      ).toBe('FSW_SET_MODE,CLEAR_ALL,TRUE');
    });

    it('substitutes defaults for missing values', () => {
      expect(buildCommandString('FSW_SET_MODE', setModeCommand, { force: false })).toBe(
        'FSW_SET_MODE,CLEAR_A,FALSE'
      );
    });

    it('returns the bare stem without arguments', () => {
      expect(buildCommandString('HDW_POWER_ON', { stem: 'HDW_POWER_ON' }, {})).toBe(
        'HDW_POWER_ON'
      );
    });
  });
});
