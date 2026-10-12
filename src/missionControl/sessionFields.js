/**
 * Config-driven session start fields.
 *
 * `missionControl.uplinkSessionFields` and
 * `missionControl.downlinkSessionFields` (build recipe or runtime JSON)
 * each list the inputs shown when an operator opens a session. Field
 * values are sent to the proxy as the `parameters` object of
 * `POST /command-sessions` or `POST /downlink-sessions`; the proxy maps
 * each key onto its backend (for AMPCS, a chill tool long option name).
 *
 * Field shape:
 *   key          parameter name sent to the proxy (required)
 *   name         input label (defaults to key)
 *   description  help text under the input
 *   control      'text' | 'number' | 'select' (defaults to 'select' when
 *                options are given, otherwise 'text')
 *   options      select values: plain values, or
 *                { value, label, sets: { otherKey: value } } where `sets`
 *                forces and locks other fields while the option is chosen
 *   default      initial value
 *   required     reject an empty value (default false)
 *   min, max     number bounds; also the search range for autoAssign
 *   pattern      text regex the value must match
 *   unique       value must differ from every active session's value
 *   uniqueAmong  only compare against sessions whose values for these
 *                other keys match the form (e.g. same host)
 *   autoAssign   number fields: start at the lowest free value in
 *                [min, max]
 */

const CONTROLS = ['text', 'number', 'select'];

function isMissing(value) {
  return value === undefined || value === null || value === '';
}

function sameValue(a, b) {
  return !isMissing(a) && !isMissing(b) && String(a) === String(b);
}

function normalizeOption(option) {
  if (option !== null && typeof option === 'object') {
    return {
      value: option.value,
      label: option.label ?? String(option.value),
      sets: option.sets && typeof option.sets === 'object' ? { ...option.sets } : {}
    };
  }

  return { value: option, label: String(option), sets: {} };
}

function numberOrNull(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function normalizeFields(fields) {
  if (!Array.isArray(fields)) {
    return [];
  }

  return fields
    .filter((field) => field && typeof field.key === 'string' && field.key.trim() !== '')
    .map((field) => {
      const options = Array.isArray(field.options) ? field.options.map(normalizeOption) : [];
      let control = CONTROLS.includes(field.control) ? field.control : null;

      if (!control) {
        control = options.length > 0 ? 'select' : 'text';
      }

      return {
        key: field.key.trim(),
        name: field.name || field.key,
        description: field.description || '',
        control,
        options,
        default: field.default,
        required: field.required === true,
        min: numberOrNull(field.min),
        max: numberOrNull(field.max),
        pattern: typeof field.pattern === 'string' ? field.pattern : null,
        unique: field.unique === true,
        uniqueAmong: Array.isArray(field.uniqueAmong) ? [...field.uniqueAmong] : [],
        autoAssign: field.autoAssign === true
      };
    });
}

function selectedOption(field, value) {
  return field.options.find((option) => sameValue(option.value, value)) || null;
}

/**
 * Values forced by the currently selected select options, keyed by the
 * field they lock.
 */
export function lockedValues(fields, values) {
  const locks = {};

  fields.forEach((field) => {
    if (field.control !== 'select') {
      return;
    }

    const option = selectedOption(field, values[field.key]);

    if (option) {
      Object.assign(locks, option.sets);
    }
  });

  return locks;
}

export function applyLocks(fields, values) {
  return { ...values, ...lockedValues(fields, values) };
}

function sessionParameters(session) {
  return session?.parameters && typeof session.parameters === 'object' ? session.parameters : {};
}

/**
 * The active session already using `value` for this field, if any.
 */
export function conflictingSession(field, value, values, activeSessions = []) {
  if (isMissing(value)) {
    return null;
  }

  return (
    activeSessions.find((session) => {
      const parameters = sessionParameters(session);

      if (!sameValue(parameters[field.key], value)) {
        return false;
      }

      return field.uniqueAmong.every((key) => sameValue(parameters[key], values[key]));
    }) || null
  );
}

export function nextFreeValue(field, values, activeSessions = []) {
  if (field.min === null || field.max === null) {
    return null;
  }

  for (let candidate = Math.ceil(field.min); candidate <= field.max; candidate++) {
    if (!conflictingSession(field, candidate, values, activeSessions)) {
      return candidate;
    }
  }

  return null;
}

function initialValue(field) {
  if (field.default !== undefined) {
    return field.default;
  }

  if (field.control === 'select' && field.options.length > 0) {
    return field.options[0].value;
  }

  return '';
}

/**
 * Applies select locks, then re-runs auto-assignment for unlocked fields
 * whose value is empty, outside [min, max], or already taken. Call when a
 * select changes or the active sessions change, not on every keystroke.
 */
export function assignFreeValues(fields, values, activeSessions = []) {
  const next = applyLocks(fields, values);
  const locks = lockedValues(fields, next);

  fields.forEach((field) => {
    if (!field.autoAssign || field.key in locks) {
      return;
    }

    const current = next[field.key];
    const number = Number(current);
    const outOfRange =
      !isMissing(current) &&
      (!Number.isFinite(number) ||
        (field.min !== null && number < field.min) ||
        (field.max !== null && number > field.max));

    if (
      isMissing(current) ||
      outOfRange ||
      conflictingSession(field, current, next, activeSessions)
    ) {
      const free = nextFreeValue(field, next, activeSessions);

      if (free !== null) {
        next[field.key] = free;
      }
    }
  });

  return next;
}

export function initialValues(fields, activeSessions = []) {
  const values = {};

  fields.forEach((field) => {
    values[field.key] = initialValue(field);
  });

  return assignFreeValues(fields, values, activeSessions);
}

function describeSession(session) {
  const id = session?.sessionId ?? session?.number;

  return id === undefined || id === null ? 'an active session' : `session ${id}`;
}

export function validateSessionValues(fields, values, activeSessions = []) {
  const errors = {};

  fields.forEach((field) => {
    const value = values[field.key];

    if (isMissing(value)) {
      if (field.required) {
        errors[field.key] = 'Value required';
      }

      return;
    }

    if (field.control === 'number') {
      const number = Number(value);

      if (!Number.isFinite(number)) {
        errors[field.key] = 'Must be a number';

        return;
      }

      if (field.min !== null && number < field.min) {
        errors[field.key] = `Must be >= ${field.min}`;

        return;
      }

      if (field.max !== null && number > field.max) {
        errors[field.key] = `Must be <= ${field.max}`;

        return;
      }
    }

    if (field.control === 'select' && field.options.length > 0 && !selectedOption(field, value)) {
      errors[field.key] = 'Choose one of the listed values';

      return;
    }

    if (field.control === 'text' && field.pattern) {
      try {
        if (!new RegExp(field.pattern).test(String(value))) {
          errors[field.key] = 'Invalid format';

          return;
        }
      } catch {
        // An invalid configured pattern is a configuration error, not user error.
      }
    }

    if (field.unique) {
      const conflict = conflictingSession(field, value, values, activeSessions);

      if (conflict) {
        errors[field.key] = `In use by ${describeSession(conflict)}`;
      }
    }
  });

  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Typed `parameters` object for the proxy. Empty optional values are left
 * out; select values keep the type they were configured with.
 */
export function toParameters(fields, values) {
  const parameters = {};
  const effective = applyLocks(fields, values);

  fields.forEach((field) => {
    const value = effective[field.key];

    if (isMissing(value)) {
      return;
    }

    if (field.control === 'number') {
      parameters[field.key] = Number(value);
    } else if (field.control === 'select') {
      const option = selectedOption(field, value);

      parameters[field.key] = option ? option.value : value;
    } else {
      parameters[field.key] = String(value);
    }
  });

  return parameters;
}

/**
 * Label/value pairs for showing a session's parameters, using configured
 * names and option labels where known.
 */
export function describeParameters(fields, parameters = {}) {
  const byKey = new Map(fields.map((field) => [field.key, field]));

  return Object.entries(parameters || {}).map(([key, value]) => {
    const field = byKey.get(key);
    const option = field ? selectedOption(field, value) : null;

    return {
      key,
      label: field ? field.name : key,
      value: option ? option.label : String(value)
    };
  });
}
