const NUMERIC_TYPES = ['numeric', 'float', 'double', 'unsigned', 'signed', 'integer'];
const INTEGER_TYPES = ['unsigned', 'signed', 'integer'];

function isMissing(value) {
  return value === undefined || value === null || value === '';
}

function hasDefault(argument) {
  return argument.default_value !== undefined && argument.default_value !== null;
}

export function defaultArgumentValues(command) {
  const values = {};

  (command?.arguments || []).forEach((argument) => {
    if (hasDefault(argument)) {
      values[argument.name] = argument.default_value;
    }
  });

  return values;
}

function validateNumeric(argument, rawValue) {
  const number = Number(rawValue);

  if (!Number.isFinite(number)) {
    return 'Must be a number';
  }

  if (
    INTEGER_TYPES.includes((argument.arg_type || '').toLowerCase()) &&
    !Number.isInteger(number)
  ) {
    return 'Must be an integer';
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
  const enumDefinition = enumMap?.[argument.enum_name];

  if (!enumDefinition) {
    return null;
  }

  const text = String(rawValue);
  const entries = enumDefinition.values || [];
  const matches = entries.some(
    (entry) => entry.symbol === text || String(entry.value) === text
  );

  if (matches) {
    return null;
  }

  return `Must be one of: ${entries.map((entry) => entry.symbol).join(', ')}`;
}

export function validateArgument(argument, rawValue, enumMap = {}) {
  if (isMissing(rawValue)) {
    return hasDefault(argument) ? null : 'Value required';
  }

  const type = (argument.arg_type || '').toLowerCase();
  let error = null;

  if (NUMERIC_TYPES.includes(type)) {
    error = validateNumeric(argument, rawValue);
  } else if (type === 'boolean') {
    error = validateBoolean(argument, rawValue);
  } else if (type === 'enum') {
    error = validateEnum(argument, rawValue, enumMap);
  }

  if (error) {
    return error;
  }

  if (argument.valid_regex) {
    try {
      if (!new RegExp(argument.valid_regex).test(String(rawValue))) {
        return 'Invalid format';
      }
    } catch (regexError) {
      return null;
    }
  }

  return null;
}

export function validateCommandArguments(command, values = {}, enumMap = {}) {
  const errors = {};

  (command?.arguments || []).forEach((argument) => {
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
    return format.true_str !== undefined && format.true_str !== null
      ? format.true_str
      : 'TRUE';
  }

  return format.false_str !== undefined && format.false_str !== null
    ? format.false_str
    : 'FALSE';
}

function effectiveValue(argument, values) {
  const raw = values?.[argument.name];

  if (isMissing(raw)) {
    return hasDefault(argument) ? argument.default_value : '';
  }

  return raw;
}

export function buildCommandString(stem, command, values = {}) {
  const parts = (command?.arguments || []).map((argument) => {
    const value = effectiveValue(argument, values);

    if ((argument.arg_type || '').toLowerCase() === 'boolean') {
      return formatBooleanValue(argument, value);
    }

    return String(value);
  });

  return parts.length > 0 ? `${stem},${parts.join(',')}` : stem;
}
