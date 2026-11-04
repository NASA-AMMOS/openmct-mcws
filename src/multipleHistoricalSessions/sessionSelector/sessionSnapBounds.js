/**
 * Session snap-to-time bounds helpers for issue #347.
 *
 * Maps the active time system to the start/end fields MCWS returns on a
 * session row, and reduces a set of selected sessions to the earliest start
 * and latest end for the snap time conductor. Sessions missing either field
 * (mixed responses) or carrying unparsable values are skipped; the snap is
 * available when at least one selected session yields usable bounds.
 */

const SESSION_TIME_FIELDS = {
  ert: ['start_time', 'end_time'],
  scet: ['start_time_scet', 'end_time_scet'],
  sclk: ['start_time_sclk', 'end_time_sclk']
};

// One day in seconds. SCLK values are seconds-based and have no end-of-day,
// so equal SCLK bounds widen by a day per the #347 decision.
const SCLK_EQUAL_BOUNDS_DAY_SECONDS = 86400;

export function getSessionTimeFields(timeSystemKey) {
  return (
    SESSION_TIME_FIELDS[timeSystemKey] ?? [
      `start_time_${timeSystemKey}`,
      `end_time_${timeSystemKey}`
    ]
  );
}

function hasUsableValue(session, field) {
  const value = session?.[field];

  return value !== undefined && value !== null && value !== '';
}

function isUsableNumber(value) {
  return typeof value === 'number' && !Number.isNaN(value);
}

export function computeSessionSnapRange(sessions, startField, endField, parse) {
  let start;
  let end;
  let usableSessions = 0;

  sessions.forEach((session) => {
    if (!hasUsableValue(session, startField) || !hasUsableValue(session, endField)) {
      return;
    }

    const parsedStart = parse(session[startField]);
    const parsedEnd = parse(session[endField]);

    if (!isUsableNumber(parsedStart) || !isUsableNumber(parsedEnd) || parsedStart > parsedEnd) {
      return;
    }

    start = start === undefined ? parsedStart : Math.min(start, parsedStart);
    end = end === undefined ? parsedEnd : Math.max(end, parsedEnd);
    usableSessions += 1;
  });

  if (usableSessions === 0) {
    return { available: false };
  }

  return { available: true, start, end };
}

export function widenEqualBounds(start, end, format) {
  if (start !== end) {
    return { start, end };
  }

  if (format && typeof format.endOfDay === 'function') {
    return { start, end: format.endOfDay(end) };
  }

  return { start, end: start + SCLK_EQUAL_BOUNDS_DAY_SECONDS };
}
