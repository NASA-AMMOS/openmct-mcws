import {
  blankArgumentValues,
  buildCommandString,
  commandHasDefaults,
  defaultArgumentValues,
  emptyRepeatSet,
  inputArguments,
  parseCommandString,
  parseRepeatJson,
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
      expect(validateArgument(forceArgument, 'maybe', enumMap)).toBe('Must be a boolean value');
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
      expect(buildCommandString('HDW_POWER_ON', { stem: 'HDW_POWER_ON' }, {})).toBe('HDW_POWER_ON');
    });
  });
  describe('plandev-ampcs argument handling', () => {
    const plandevEnums = {
      Mode: {
        name: 'Mode',
        values: [
          { symbol: 'SAFE', numeric: 0 },
          { symbol: 'NOMINAL', numeric: 1 }
        ]
      }
    };
    const fill = { name: 'spare', arg_type: 'fill', description: '' };
    const label = {
      name: 'label',
      arg_type: 'var_string',
      default_value: null,
      max_bit_length: 64,
      valid_regex: null
    };
    const fixedLabel = { name: 'tag', arg_type: 'fixed_string', description: '' };
    const mode = { name: 'mode', arg_type: 'enum', enum_name: 'Mode', default_value: null };
    const offset = {
      name: 'offset',
      arg_type: 'numeric',
      type: 'integer',
      default_value: null,
      range: { min: -100, max: 100 }
    };
    const level = { name: 'level', arg_type: 'numeric', type: 'unsigned', default_value: null };
    const channels = {
      name: 'channels',
      arg_type: 'repeat',
      repeat: {
        min: 1,
        max: 2,
        arguments: [
          { name: 'id', arg_type: 'unsigned', default_value: null },
          fill,
          { name: 'state', arg_type: 'enum', enum_name: 'Mode', default_value: 'SAFE' }
        ]
      }
    };
    const command = { stem: 'TEST_CMD', arguments: [fill, label, mode, offset, channels] };

    it('leaves fill arguments out of inputs, validation, and the command string', () => {
      expect(inputArguments(command).map((argument) => argument.name)).toEqual([
        'label',
        'mode',
        'offset',
        'channels'
      ]);
      expect(validateArgument(fill, undefined, plandevEnums)).toBe(null);

      const values = { label: 'x', mode: 'SAFE', offset: '1', channels: [{ id: '3' }] };

      expect(validateCommandArguments(command, values, plandevEnums)).toEqual({
        valid: true,
        errors: {}
      });
      expect(buildCommandString('TEST_CMD', command, values, plandevEnums)).toBe(
        'TEST_CMD,"x",SAFE,1,1,3,SAFE'
      );
    });

    it('quotes string values so commas stay inside one argument', () => {
      expect(
        buildCommandString(
          'ECHO',
          { arguments: [label, fixedLabel] },
          { label: 'hello, world', tag: 'A' }
        )
      ).toBe('ECHO,"hello, world","A"');
    });

    it('rejects double quotes and over-long strings', () => {
      expect(validateArgument(label, 'say "hi"')).toBe('Double quotes are not allowed');
      expect(validateArgument(label, '123456789')).toBe('Must be at most 8 characters');
      expect(validateArgument(label, '12345678')).toBe(null);
    });

    it('accepts enum numeric values from plandev-ampcs and sends the symbol', () => {
      expect(validateArgument(mode, '1', plandevEnums)).toBe(null);
      expect(validateArgument(mode, '7', plandevEnums)).toBe('Must be one of: SAFE, NOMINAL');
      expect(buildCommandString('SET', { arguments: [mode] }, { mode: '1' }, plandevEnums)).toBe(
        'SET,NOMINAL'
      );
    });

    it('applies the nested numeric type', () => {
      expect(validateArgument(offset, '2.5')).toBe('Must be an integer');
      expect(validateArgument(offset, '-5')).toBe(null);
      expect(validateArgument(offset, '-101')).toBe('Must be >= -100');
      expect(validateArgument(level, '-1')).toBe('Must be >= 0');
      expect(validateArgument(level, '4')).toBe(null);
    });

    it('builds repeat arguments as a count followed by each set', () => {
      expect(
        buildCommandString(
          'CFG',
          { arguments: [channels] },
          {
            channels: [
              { id: '1', state: 'NOMINAL' },
              { id: '2', state: '0' }
            ]
          },
          plandevEnums
        )
      ).toBe('CFG,2,1,NOMINAL,2,SAFE');
    });

    it('validates repeat set counts and nested values', () => {
      expect(validateArgument(channels, [], plandevEnums)).toBe('Needs at least 1 repeat set');
      expect(validateArgument(channels, [{}, {}, {}], plandevEnums)).toBe(
        'Allows at most 2 repeat sets'
      );
      expect(validateArgument(channels, [{ id: 'x' }], plandevEnums)).toBe(
        'Set 1, id: Must be a number'
      );
      expect(validateArgument(channels, [{ id: '9' }], plandevEnums)).toBe(null);
    });

    it('seeds repeat arguments with the minimum number of default sets', () => {
      expect(emptyRepeatSet(channels)).toEqual({ id: '', state: 'SAFE' });
      expect(defaultArgumentValues({ arguments: [channels, fill] })).toEqual({
        channels: [{ id: '', state: 'SAFE' }]
      });
    });

    it('parses repeat JSON into sets with defaults filled', () => {
      expect(
        parseRepeatJson(channels, '[{"id": 1, "state": "NOMINAL"}, {"id": "2"}]', plandevEnums)
      ).toEqual({
        sets: [
          { id: 1, state: 'NOMINAL' },
          { id: '2', state: 'SAFE' }
        ],
        error: null
      });
    });

    it('rejects malformed repeat JSON', () => {
      expect(parseRepeatJson(channels, 'not json', plandevEnums)).toEqual({
        sets: null,
        error: 'Invalid JSON'
      });
      expect(parseRepeatJson(channels, '{"id": 1}', plandevEnums)).toEqual({
        sets: null,
        error: 'Repeat JSON must be an array of sets'
      });
      expect(parseRepeatJson(channels, '[3]', plandevEnums)).toEqual({
        sets: null,
        error: 'Set 1 must be an object'
      });
      expect(parseRepeatJson(channels, '   ', plandevEnums)).toEqual({
        sets: null,
        error: 'Needs at least 1 repeat set'
      });
    });

    it('rejects unknown keys and invalid nested values', () => {
      expect(parseRepeatJson(channels, '[{"id": "1", "bogus": 2}]', plandevEnums)).toEqual({
        sets: null,
        error: 'Set 1 has unknown argument "bogus"'
      });
      expect(parseRepeatJson(channels, '[{"id": "x"}]', plandevEnums)).toEqual({
        sets: null,
        error: 'Set 1, id: Must be a number'
      });
      expect(parseRepeatJson(channels, '[]', plandevEnums)).toEqual({
        sets: null,
        error: 'Needs at least 1 repeat set'
      });
      expect(
        parseRepeatJson(channels, '[{"id": "1"}, {"id": "2"}, {"id": "3"}]', plandevEnums)
      ).toEqual({ sets: null, error: 'Allows at most 2 repeat sets' });
    });
  });

  describe('parseCommandString', () => {
    it('round-trips a built command string', () => {
      const text = buildCommandString(
        'FSW_SET_MODE',
        setModeCommand,
        { mode: 'CLEAR_ALL', force: 'TRUE' },
        enumMap
      );

      expect(parseCommandString(text, setModeCommand, enumMap)).toEqual({
        values: { mode: 'CLEAR_ALL', force: 'TRUE' },
        error: null
      });
    });

    it('matches the stem, enum symbols, and boolean forms case-insensitively', () => {
      expect(parseCommandString('fsw_set_mode,clear_all,true', setModeCommand, enumMap)).toEqual({
        values: { mode: 'CLEAR_ALL', force: 'TRUE' },
        error: null
      });
    });

    it('accepts enum numeric values and normalizes to the symbol', () => {
      expect(parseCommandString('FSW_SET_MODE,1,FALSE', setModeCommand, enumMap).values.mode).toBe(
        'CLEAR_ALL'
      );
    });

    it('keeps quoted string values with commas in one argument', () => {
      const echo = { stem: 'ECHO', arguments: [{ name: 'text', arg_type: 'var_string' }] };

      expect(parseCommandString('ECHO,"a,b"', echo)).toEqual({
        values: { text: 'a,b' },
        error: null
      });
    });

    it('parses repeat arguments as a count followed by each set', () => {
      const plandevEnums = {
        Mode: {
          values: [
            { symbol: 'SAFE', numeric: 0 },
            { symbol: 'NOMINAL', numeric: 1 }
          ]
        }
      };
      const channels = {
        name: 'channels',
        arg_type: 'repeat',
        repeat: {
          min: 1,
          max: 2,
          arguments: [
            { name: 'id', arg_type: 'unsigned' },
            { name: 'state', arg_type: 'enum', enum_name: 'Mode' }
          ]
        }
      };
      const cfg = { stem: 'CFG', arguments: [channels] };

      expect(parseCommandString('CFG,2,1,NOMINAL,2,safe', cfg, plandevEnums)).toEqual({
        values: {
          channels: [
            { id: '1', state: 'NOMINAL' },
            { id: '2', state: 'SAFE' }
          ]
        },
        error: null
      });
    });

    it('rejects a mismatched stem, bad counts, and unterminated quotes', () => {
      const mismatched = parseCommandString('OTHER,1,TRUE', setModeCommand, enumMap);

      expect(mismatched.values).toBe(null);
      expect(mismatched.error).toContain('not FSW_SET_MODE');
      expect(parseCommandString('FSW_SET_MODE,CLEAR_A', setModeCommand, enumMap).values).toBe(null);
      expect(
        parseCommandString('FSW_SET_MODE,CLEAR_A,TRUE,EXTRA', setModeCommand, enumMap).values
      ).toBe(null);
      expect(parseCommandString('FSW_SET_MODE,"CLEAR_A', setModeCommand, enumMap)).toEqual({
        values: null,
        error: 'Unterminated double quote'
      });
    });
  });

  describe('blank values and strict defaults', () => {
    it('seeds a blank form with every input argument', () => {
      expect(
        blankArgumentValues({ arguments: [modeArgument, forceArgument, retriesArgument] })
      ).toEqual({ mode: '', force: '', retries: '' });
    });

    it('detects commands that declare defaults', () => {
      expect(commandHasDefaults(setModeCommand)).toBe(true);
      expect(commandHasDefaults({ arguments: [forceArgument, retriesArgument] })).toBe(false);
    });

    it('requires blanks for defaulted arguments when defaults are off', () => {
      const strict = validateCommandArguments(
        setModeCommand,
        { mode: '', force: 'TRUE' },
        enumMap,
        { applyDefaults: false }
      );

      expect(strict.valid).toBe(false);
      expect(strict.errors.mode).toBe('Value required');
      expect(
        validateCommandArguments(setModeCommand, { mode: '', force: 'TRUE' }, enumMap).valid
      ).toBe(true);
    });
  });
});
