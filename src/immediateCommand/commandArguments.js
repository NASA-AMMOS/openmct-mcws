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

function validateRepeat(argument, rawValue, enumMap) {
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
      const error = validateArgument(child, sets[index]?.[child.name], enumMap);

      if (error) {
        return `Set ${index + 1}, ${child.name}: ${error}`;
      }
    }
  }

  return null;
}

export function validateArgument(argument, rawValue, enumMap = {}) {
  if (isFillArgument(argument)) {
    return null;
  }

  if (isRepeatArgument(argument)) {
    return validateRepeat(argument, rawValue, enumMap);
  }

  if (isMissing(rawValue)) {
    return hasDefault(argument) ? null : 'Value required';
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

export function validateCommandArguments(command, values = {}, enumMap = {}) {
  const errors = {};

  inputArguments(command).forEach((argument) => {
    const error = validateArgument(argument, values[argument.name], enumMap);

    if (error) {
      errors[argument.name] = error;
    }
  });

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
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
