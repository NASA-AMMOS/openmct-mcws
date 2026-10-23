/**
 * Argument helpers for plandev-ampcs command definitions.
 *
 * Command strings follow the chill_send_cmd input format:
 * `STEM,arg1,...,argN`, where fill arguments are never input, string
 * values are wrapped in double quotes, and a repeat argument is written as
 * its repeat count followed by each repeat set's values.
 */

const FLOAT_TYPES = ['float', 'double'];
const INTEGER_TYPES = ['unsigned', 'signed', 'integer'];
const NUMERIC_TYPES = ['numeric', ...FLOAT_TYPES, ...INTEGER_TYPES];
const STRING_TYPES = ['var_string', 'fixed_string', 'string'];

function typeOf(argument) {
  return (argument?.arg_type || '').toLowerCase();
}

/**
 * `numeric` arguments carry their concrete kind in `type`
 * (`float`, `integer`, or `unsigned`).
 */
function numericKindOf(argument) {
  const type = typeOf(argument);

  if (type === 'numeric') {
    return (argument.type || 'float').toLowerCase();
  }

  return type;
}

function isMissing(value) {
  return value === undefined || value === null || value === '';
}

function hasDefault(argument) {
  return argument.default_value !== undefined && argument.default_value !== null;
}

export function isFillArgument(argument) {
  return typeOf(argument) === 'fill';
}

export function isRepeatArgument(argument) {
  return typeOf(argument) === 'repeat';
}

export function isStringArgument(argument) {
  return STRING_TYPES.includes(typeOf(argument));
}

/**
 * Arguments an operator supplies a value for: everything except fill.
 */
export function inputArguments(argumentsOrCommand) {
  const list = Array.isArray(argumentsOrCommand)
    ? argumentsOrCommand
    : argumentsOrCommand?.arguments || [];

  return list.filter((argument) => !isFillArgument(argument));
}

function repeatChildren(argument) {
  return inputArguments(argument?.repeat?.arguments || []);
}

export function repeatBounds(argument) {
  const min = argument?.repeat?.min;
  const max = argument?.repeat?.max;

  return {
    min: Number.isInteger(min) && min > 0 ? min : 0,
    max: Number.isInteger(max) ? max : null
  };
}

/**
 * Values for one new repeat set, seeded with the nested defaults.
 */
export function emptyRepeatSet(argument) {
  const set = {};

  repeatChildren(argument).forEach((child) => {
    set[child.name] = hasDefault(child) ? child.default_value : '';
  });

  return set;
}

export function defaultArgumentValues(command) {
  const values = {};

  inputArguments(command).forEach((argument) => {
    if (isRepeatArgument(argument)) {
      const { min } = repeatBounds(argument);

      values[argument.name] = Array.from({ length: min }, () => emptyRepeatSet(argument));
    } else if (hasDefault(argument)) {
      values[argument.name] = argument.default_value;
    }
  });

  return values;
}

function blankRepeatSet(argument) {
  const set = {};

  repeatChildren(argument).forEach((child) => {
    set[child.name] = '';
  });

  return set;
}

/**
 * Blank form values: every input argument present but empty, repeat
 * arguments at their minimum set count with blank children. Used when
 * the operator wants to enter every argument manually.
 */
export function blankArgumentValues(command) {
  const values = {};

  inputArguments(command).forEach((argument) => {
    if (isRepeatArgument(argument)) {
      const { min } = repeatBounds(argument);

      values[argument.name] = Array.from({ length: min }, () => blankRepeatSet(argument));
    } else {
      values[argument.name] = '';
    }
  });

  return values;
}

/**
 * True when any input argument (or repeat child) declares a default.
 */
export function commandHasDefaults(command) {
  return inputArguments(command).some((argument) => {
    if (isRepeatArgument(argument)) {
      return repeatChildren(argument).some((child) => hasDefault(child));
    }

    return hasDefault(argument);
  });
}

function enumEntries(argument, enumMap) {
  return enumMap?.[argument.enum_name]?.values || [];
}

function enumNumericOf(entry) {
  if (entry.numeric !== undefined && entry.numeric !== null) {
    return entry.numeric;
  }

  return entry.value;
}

function validateNumeric(argument, rawValue) {
  const number = Number(rawValue);
  const kind = numericKindOf(argument);

  if (typeof rawValue === 'string' && rawValue.trim() === '') {
    return 'Must be a number';
  }

  if (!Number.isFinite(number)) {
    return 'Must be a number';
  }

  if (INTEGER_TYPES.includes(kind) && !Number.isInteger(number)) {
    return 'Must be an integer';
  }

  if (kind === 'unsigned' && number < 0) {
    return 'Must be >= 0';
  }

  const range = argument.range || null;

  if (range) {
    if (range.min !== undefined && range.min !== null && number < range.min) {
      return `Must be >= ${range.min}`;
    }

    if (range.max !== undefined && range.max !== null && number > range.max) {
      return `Must be <= ${range.max}`;
    }
  }

  return null;
}

function validateBoolean(argument, rawValue) {
  if (typeof rawValue === 'boolean') {
    return null;
  }

  const accepted = ['true', 'false'];
  const format = argument.format || {};

  [format.true_str, format.false_str].forEach((form) => {
    if (form !== undefined && form !== null && form !== '') {
      accepted.push(String(form).toLowerCase());
    }
  });

  if (accepted.includes(String(rawValue).toLowerCase())) {
    return null;
  }

  return 'Must be a boolean value';
}

function validateEnum(argument, rawValue, enumMap) {
  const entries = enumEntries(argument, enumMap);

  if (entries.length === 0) {
    return null;
  }

  const text = String(rawValue);
  const matches = entries.some(
    (entry) => entry.symbol === text || String(enumNumericOf(entry)) === text
  );

  if (matches) {
    return null;
  }

  return `Must be one of: ${entries.map((entry) => entry.symbol).join(', ')}`;
}

function validateString(argument, rawValue) {
  const text = String(rawValue);

  if (text.includes('"')) {
    return 'Double quotes are not allowed';
  }

  const maxBits = argument.max_bit_length ?? null;

  if (Number.isInteger(maxBits) && maxBits > 0 && text.length > Math.floor(maxBits / 8)) {
    return `Must be at most ${Math.floor(maxBits / 8)} characters`;
  }

  return null;
}

function validateRepeat(argument, rawValue, enumMap, options = {}) {
  const sets = Array.isArray(rawValue) ? rawValue : [];
  const { min, max } = repeatBounds(argument);

  if (sets.length < min) {
    return `Needs at least ${min} repeat set${min === 1 ? '' : 's'}`;
  }

  if (max !== null && sets.length > max) {
    return `Allows at most ${max} repeat set${max === 1 ? '' : 's'}`;
  }

  for (let index = 0; index < sets.length; index++) {
    for (const child of repeatChildren(argument)) {
      const error = validateArgument(child, sets[index]?.[child.name], enumMap, options);

      if (error) {
        return `Set ${index + 1}, ${child.name}: ${error}`;
      }
    }
  }

  return null;
}

/**
 * @param {object} [options] `applyDefaults: false` treats a blank like a
 * missing required value even when the dictionary declares a default
 * (strict mode: the form must show exactly what will be sent).
 */
export function validateArgument(argument, rawValue, enumMap = {}, options = {}) {
  const applyDefaults = options.applyDefaults !== false;

  if (isFillArgument(argument)) {
    return null;
  }

  if (isRepeatArgument(argument)) {
    return validateRepeat(argument, rawValue, enumMap, options);
  }

  if (isMissing(rawValue)) {
    return applyDefaults && hasDefault(argument) ? null : 'Value required';
  }

  const type = typeOf(argument);
  let error = null;

  if (NUMERIC_TYPES.includes(type)) {
    error = validateNumeric(argument, rawValue);
  } else if (type === 'boolean') {
    error = validateBoolean(argument, rawValue);
  } else if (type === 'enum') {
    error = validateEnum(argument, rawValue, enumMap);
  } else if (isStringArgument(argument)) {
    error = validateString(argument, rawValue);
  }

  if (error) {
    return error;
  }

  if (argument.valid_regex) {
    try {
      if (!new RegExp(argument.valid_regex).test(String(rawValue))) {
        return 'Invalid format';
      }
    } catch {
      return null;
    }
  }

  return null;
}

export function validateCommandArguments(command, values = {}, enumMap = {}, options = {}) {
  const errors = {};

  inputArguments(command).forEach((argument) => {
    const error = validateArgument(argument, values[argument.name], enumMap, options);

    if (error) {
      errors[argument.name] = error;
    }
  });

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Parses a JSON paste for a repeat argument into repeat sets.
 *
 * Returns `{ sets, error }`: on success `sets` holds one object per
 * set with exactly the repeat's input children (missing values keep
 * their defaults) and `error` is null; on failure `sets` is null and
 * `error` describes the first problem found. Blank text parses as an
 * empty set list. Counts and nested values reuse the form validation
 * so both entry modes accept the same input.
 */
export function parseRepeatJson(argument, rawText, enumMap = {}) {
  const text = String(rawText ?? '');
  let parsed;

  try {
    parsed = text.trim() === '' ? [] : JSON.parse(text);
  } catch {
    return { sets: null, error: 'Invalid JSON' };
  }

  if (!Array.isArray(parsed)) {
    return { sets: null, error: 'Repeat JSON must be an array of sets' };
  }

  const children = repeatChildren(argument);
  const names = new Set(children.map((child) => child.name));
  const sets = [];

  for (let index = 0; index < parsed.length; index++) {
    const raw = parsed[index];

    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return { sets: null, error: `Set ${index + 1} must be an object` };
    }

    for (const key of Object.keys(raw)) {
      if (!names.has(key)) {
        return { sets: null, error: `Set ${index + 1} has unknown argument "${key}"` };
      }
    }

    const set = emptyRepeatSet(argument);

    for (const child of children) {
      if (raw[child.name] !== undefined) {
        set[child.name] = raw[child.name];
      }
    }

    sets.push(set);
  }

  const error = validateRepeat(argument, sets, enumMap);

  if (error) {
    return { sets: null, error };
  }

  return { sets, error: null };
}

function formatBooleanValue(argument, value) {
  const format = argument.format || {};
  const text = String(value).toLowerCase();
  const trueForms = ['true'];

  if (format.true_str !== undefined && format.true_str !== null) {
    trueForms.push(String(format.true_str).toLowerCase());
  }

  if (value === true || trueForms.includes(text)) {
    return format.true_str !== undefined && format.true_str !== null ? format.true_str : 'TRUE';
  }

  return format.false_str !== undefined && format.false_str !== null ? format.false_str : 'FALSE';
}

/**
 * Numeric enum input is sent as its symbol so the uplink tool always
 * receives a dictionary symbol.
 */
function formatEnumValue(argument, value, enumMap) {
  const text = String(value);
  const entries = enumEntries(argument, enumMap);

  if (entries.some((entry) => entry.symbol === text)) {
    return text;
  }

  const byNumeric = entries.find((entry) => String(enumNumericOf(entry)) === text);

  return byNumeric ? byNumeric.symbol : text;
}

function effectiveValue(argument, raw) {
  if (isMissing(raw)) {
    return hasDefault(argument) ? argument.default_value : '';
  }

  return raw;
}

function formatValue(argument, raw, enumMap) {
  const value = effectiveValue(argument, raw);
  const type = typeOf(argument);

  if (type === 'boolean') {
    return formatBooleanValue(argument, value);
  }

  if (type === 'enum') {
    return formatEnumValue(argument, value, enumMap);
  }

  if (isStringArgument(argument)) {
    return `"${value}"`;
  }

  return String(value);
}

function formatArgument(argument, raw, enumMap) {
  if (!isRepeatArgument(argument)) {
    return [formatValue(argument, raw, enumMap)];
  }

  const sets = Array.isArray(raw) ? raw : [];
  const parts = [String(sets.length)];

  sets.forEach((set) => {
    repeatChildren(argument).forEach((child) => {
      parts.push(formatValue(child, set?.[child.name], enumMap));
    });
  });

  return parts;
}

export function buildCommandString(stem, command, values = {}, enumMap = {}) {
  const parts = inputArguments(command).flatMap((argument) =>
    formatArgument(argument, values?.[argument.name], enumMap)
  );

  return parts.length > 0 ? `${stem},${parts.join(',')}` : stem;
}

/**
 * The stem token (first comma-separated value) of a command string,
 * trimmed but not case-normalized, or '' when the text is blank.
 */
export function commandStemToken(commandText) {
  const { tokens } = tokenizeCommandString(commandText);

  return tokens && tokens.length > 0 ? tokens[0] : '';
}

function tokenizeCommandString(commandText) {
  const tokens = [];
  let current = '';
  let inQuotes = false;

  for (const character of String(commandText ?? '')) {
    if (character === '"') {
      inQuotes = !inQuotes;
    } else if (character === ',' && !inQuotes) {
      tokens.push(current.trim());
      current = '';
    } else {
      current += character;
    }
  }

  if (inQuotes) {
    return { tokens: null, error: 'Unterminated double quote' };
  }

  tokens.push(current.trim());

  return { tokens, error: null };
}

function parseEnumToken(argument, token, enumMap) {
  const entries = enumEntries(argument, enumMap);
  const text = String(token);
  const bySymbol = entries.find(
    (entry) => String(entry.symbol).toLowerCase() === text.toLowerCase()
  );

  if (bySymbol) {
    return bySymbol.symbol;
  }

  const byNumeric = entries.find((entry) => String(enumNumericOf(entry)) === text);

  return byNumeric ? byNumeric.symbol : text;
}

function parseBooleanToken(argument, token) {
  const format = argument.format || {};
  const text = String(token).toLowerCase();
  const trueForms = ['true'];
  const falseForms = ['false'];

  if (format.true_str !== undefined && format.true_str !== null) {
    trueForms.push(String(format.true_str).toLowerCase());
  }

  if (format.false_str !== undefined && format.false_str !== null) {
    falseForms.push(String(format.false_str).toLowerCase());
  }

  if (trueForms.includes(text)) {
    return format.true_str !== undefined && format.true_str !== null ? format.true_str : 'TRUE';
  }

  if (falseForms.includes(text)) {
    return format.false_str !== undefined && format.false_str !== null ? format.false_str : 'FALSE';
  }

  return token;
}

function parseTokenValue(argument, token, enumMap) {
  const type = typeOf(argument);

  if (type === 'enum') {
    return parseEnumToken(argument, token, enumMap);
  }

  if (type === 'boolean') {
    return parseBooleanToken(argument, token);
  }

  return token;
}

/**
 * Parses a `STEM,value,...` command string (the `buildCommandString`
 * format) back into form values for `command`. The stem must match
 * `command.stem` case-insensitively; enum symbols and boolean forms also
 * match case-insensitively and are normalized to the dictionary values
 * the form controls bind. String values may be double-quoted to contain
 * commas. Returns `{ values, error }`: structural problems (stem
 * mismatch, wrong value count, bad repeat count) yield `values: null`;
 * otherwise `values` holds every input argument (unchecked — run
 * `validateCommandArguments` for per-argument errors).
 */
export function parseCommandString(commandText, command, enumMap = {}) {
  const { tokens, error } = tokenizeCommandString(commandText);

  if (error) {
    return { values: null, error };
  }

  if (!command || !command.stem) {
    return { values: null, error: 'Unknown command' };
  }

  const [stemToken, ...valueTokens] = tokens;

  if (String(stemToken).toUpperCase() !== String(command.stem).toUpperCase()) {
    return { values: null, error: `Command string is for ${stemToken}, not ${command.stem}` };
  }

  const values = {};
  let cursor = 0;

  for (const argument of inputArguments(command)) {
    if (isRepeatArgument(argument)) {
      const countToken = valueTokens[cursor];

      if (countToken === undefined) {
        return { values: null, error: `Missing repeat count for ${argument.name}` };
      }

      const count = Number(countToken);

      if (!Number.isInteger(count) || count < 0) {
        return { values: null, error: `Repeat count for ${argument.name} must be a whole number` };
      }

      cursor++;
      const sets = [];

      for (let setIndex = 0; setIndex < count; setIndex++) {
        const set = {};

        for (const child of repeatChildren(argument)) {
          const token = valueTokens[cursor];

          if (token === undefined) {
            return {
              values: null,
              error: `Missing value for ${argument.name} set ${setIndex + 1}, ${child.name}`
            };
          }

          set[child.name] = parseTokenValue(child, token, enumMap);
          cursor++;
        }

        sets.push(set);
      }

      values[argument.name] = sets;
    } else {
      const token = valueTokens[cursor];

      if (token === undefined) {
        return { values: null, error: `Missing value for ${argument.name}` };
      }

      values[argument.name] = parseTokenValue(argument, token, enumMap);
      cursor++;
    }
  }

  if (cursor < valueTokens.length) {
    return {
      values: null,
      error: `Expected ${cursor + 1} value(s) for ${command.stem}, got ${valueTokens.length + 1}`
    };
  }

  return { values, error: null };
}
