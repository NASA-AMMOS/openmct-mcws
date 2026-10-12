/**
 * Dynamic time expressions for advanced time-system configuration.
 *
 * Whole-string markers such as "${dynamic:${now} - ${two_hours}}" revive to
 * closures that re-evaluate the time expression on every call. This restores
 * the config.js-era ability to declare preset bounds as functions
 * (eg. `start: () => Date.now() - 7200000`) through JSON configuration,
 * which cannot carry functions itself.
 *
 * The marker syntax and time vocabulary are shared with the Open MCT build
 * tool (see substituteVariables in openmct-build's mct-builder-core.js):
 * identical markers must evaluate identically in both places. The build tool
 * revives markers in instance/recipe yaml options; this module revives them
 * in mcws-config.json (runtime) options, which never pass through the
 * builder's substitution.
 *
 * This module additionally supports UTC-calendar anchors (dayStart:n,
 * monthStart:n, yearStart:n) that the build tool does not know. Markers
 * using calendar anchors must live in mcws-config.json (or another runtime
 * source): the same marker in yaml would be revived by the build tool and
 * evaluate to undefined.
 *
 * Only useful where the receiving code invokes function values. The canonical
 * consumer is the Open MCT time conductor, which evaluates function preset
 * bounds on every preset click.
 */

const TIME_WORDS = {
  five_seconds: 5000,
  ten_seconds: 10000,
  fifteen_seconds: 15000,
  thirty_seconds: 30000,
  one_minute: 60000,
  five_minutes: 300000,
  ten_minutes: 600000,
  fifteen_minutes: 900000,
  thirty_minutes: 1800000,
  one_hour: 3600000,
  two_hours: 7200000,
  eight_hours: 28800000,
  one_day: 86400000,
  one_week: 604800000,
  one_month: 2592000000,
  one_year: 31536000000,
  two_years: 63072000000,
  five_years: 157680000000,
  ten_years: 315360000000
};

const TIME_WORD_PATTERN = Object.keys(TIME_WORDS).join('|');
const DATE_PATTERN = '\\d{4}[-/]\\d{2}[-/]\\d{2}.*';
const CALENDAR_PATTERN = '(?:dayStart|monthStart|yearStart):-?\\d+';
const TOKEN_REGEX = new RegExp(
  `\\$\\{(now|${TIME_WORD_PATTERN}|${DATE_PATTERN}|${CALENDAR_PATTERN})\\}`,
  'g'
);
const DYNAMIC_MARKER_REGEX = /^\$\{dynamic:(.*)\}$/s;
const SIMPLE_MATH_REGEX = /^(\d+)?\s*([-+]?\s*\d+)?$/;

/**
 * Resolve a UTC-calendar anchor: dayStart:n is 00:00 UTC n days from today,
 * monthStart:n is 00:00 UTC on the first of the month n months out, and
 * yearStart:n is 00:00 UTC on January 1st n years out.
 */
function resolveCalendarAnchor(anchor, offset) {
  const now = new Date();

  if (anchor === 'dayStart') {
    return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offset);
  }

  if (anchor === 'monthStart') {
    return Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1);
  }

  return Date.UTC(now.getUTCFullYear() + offset, 0, 1);
}

/**
 * Evaluate a time expression immediately, using the shared ${}-token
 * vocabulary (eg. "${now} - ${two_hours}"). Mirrors the build tool's
 * getEpochTime for identical input.
 * @param {string} timeExpression
 * @returns {number|undefined} epoch milliseconds, or undefined if invalid
 */
export function evaluateTimeExpression(timeExpression) {
  const resolved = timeExpression.replaceAll(TOKEN_REGEX, (match, word) => {
    if (word === 'now') {
      return Date.now();
    }

    if (Object.hasOwn(TIME_WORDS, word)) {
      return TIME_WORDS[word];
    }

    const calendarMatch = /^(dayStart|monthStart|yearStart):(-?\d+)$/.exec(word);

    if (calendarMatch) {
      return resolveCalendarAnchor(calendarMatch[1], parseInt(calendarMatch[2], 10));
    }

    const date = new Date(word);

    return isNaN(date.getTime()) ? match : date.getTime();
  });

  const parsed = SIMPLE_MATH_REGEX.exec(resolved);

  if (!parsed) {
    return undefined;
  }

  return parsed.slice(1).reduce((total, part) => {
    if (part === undefined) {
      return total;
    }

    return total + parseInt(part.replaceAll(' ', ''), 10) || 0;
  }, 0);
}

/**
 * Revive whole-string dynamic markers anywhere in a value to closures that
 * re-evaluate the time expression on every call. All other values pass
 * through untouched (including functions, which need no revival).
 * @param {*} value configuration value to revive markers in
 * @returns {*} value with markers replaced by closures
 */
export function reviveDynamicMarkers(value) {
  if (typeof value === 'string') {
    const match = DYNAMIC_MARKER_REGEX.exec(value);

    if (match) {
      const timeExpression = match[1];

      return () => evaluateTimeExpression(timeExpression);
    }

    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => reviveDynamicMarkers(item));
  }

  if (value !== null && typeof value === 'object') {
    return Object.entries(value).reduce((revived, [key, entry]) => {
      revived[key] = reviveDynamicMarkers(entry);

      return revived;
    }, {});
  }

  return value;
}

/**
 * Resolve dynamic markers and revived closures to plain numbers immediately.
 * Menu-level bounds and clockOffsets flow into core setBounds/setClockOffsets,
 * which require integers and never invoke functions, so unlike preset bounds
 * they must be evaluated once at menu build (matching 5.x config.js, where
 * menu bounds were Date computations at load and only preset bounds were
 * per-click functions).
 * @param {*} value menu-level bounds or clockOffsets to resolve
 * @returns {*} value with markers/closures replaced by numbers
 */
export function resolveEagerMarkers(value) {
  if (typeof value === 'function') {
    return value();
  }

  if (typeof value === 'string') {
    const match = DYNAMIC_MARKER_REGEX.exec(value);

    if (match) {
      return evaluateTimeExpression(match[1]);
    }

    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveEagerMarkers(item));
  }

  if (value !== null && typeof value === 'object') {
    return Object.entries(value).reduce((resolved, [key, entry]) => {
      resolved[key] = resolveEagerMarkers(entry);

      return resolved;
    }, {});
  }

  return value;
}
