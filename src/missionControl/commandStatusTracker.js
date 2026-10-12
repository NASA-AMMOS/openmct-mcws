import { reactive } from 'vue';

const DEFAULT_MAX_ENTRIES = 50;
const DEFAULT_MATCH_WINDOW_MS = 5000;
const DOY_TIME = /^(\d{4})-(\d{3})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3})\d*)?Z?$/;

/**
 * Parses MCWS day-of-year times (`2026-285T16:04:06.429`) and ISO-8601
 * times as UTC milliseconds. Returns null when the text is not a time.
 */
export function parseEventTime(text) {
  if (text === undefined || text === null || text === '') {
    return null;
  }

  if (typeof text === 'number') {
    return Number.isFinite(text) ? text : null;
  }

  const doy = DOY_TIME.exec(String(text).trim());

  if (doy) {
    const [, year, day, hour, minute, second, fraction = '0'] = doy;

    return Date.UTC(
      Number(year),
      0,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
      Number(fraction.padEnd(3, '0'))
    );
  }

  const parsed = Date.parse(String(text));

  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Formats UTC milliseconds as an MCWS day-of-year time.
 */
export function formatDayOfYear(milliseconds) {
  const date = new Date(milliseconds);
  const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 1);
  const day = Math.floor((milliseconds - startOfYear) / 86400000) + 1;
  const pad = (value, width = 2) => String(value).padStart(width, '0');

  return (
    `${date.getUTCFullYear()}-${pad(day, 3)}T${pad(date.getUTCHours())}:` +
    `${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}.` +
    `${pad(date.getUTCMilliseconds(), 3)}`
  );
}

export function commandStem(commandString) {
  return String(commandString ?? '')
    .split(',')[0]
    .trim()
    .toUpperCase();
}

function isTrue(value) {
  return value === true || String(value).toLowerCase() === 'true';
}

function present(value) {
  return value !== undefined && value !== null && value !== '';
}

/**
 * Tracks commands sent from this browser and their radiation status as
 * reported by command events (`/streams/command-events` or
 * `/command-events`).
 *
 * Events are matched to a sent command by `commandId` when the proxy
 * provides it. Otherwise an event is matched to the oldest unresolved
 * command with the same session and stem sent no earlier than the match
 * window before the event; later events carrying the same `request_id`
 * stay with that command.
 */
export class CommandStatusTracker {
  constructor({ maxEntries = DEFAULT_MAX_ENTRIES, matchWindowMs = DEFAULT_MATCH_WINDOW_MS } = {}) {
    this.maxEntries = maxEntries;
    this.matchWindowMs = matchWindowMs;
    this.state = reactive({ entries: [] });
  }

  get entries() {
    return this.state.entries;
  }

  track(dispatch, { sessionId, requested, kind } = {}) {
    const commandString = requested ?? dispatch?.requested ?? '';
    const entry = {
      commandId: dispatch?.commandId ?? null,
      requested: dispatch?.requested ?? commandString,
      dispatchTime: dispatch?.dispatchTime ?? new Date().toISOString(),
      sessionId: sessionId ?? null,
      kind: kind ?? null,
      stem: commandStem(commandString),
      status: 'Dispatched',
      final: false,
      failReason: null,
      scmfFile: null,
      requestId: null,
      eventTime: null,
      matchedBy: null
    };

    this.state.entries.unshift(entry);

    if (this.state.entries.length > this.maxEntries) {
      this.state.entries.splice(this.maxEntries);
    }

    return this.state.entries[0];
  }

  /**
   * Earliest dispatch time of commands still waiting for a final status.
   */
  earliestPendingTime() {
    const times = this.state.entries
      .filter((entry) => !entry.final)
      .map((entry) => parseEventTime(entry.dispatchTime))
      .filter((time) => time !== null);

    return times.length > 0 ? Math.min(...times) : null;
  }

  hasPending() {
    return this.state.entries.some((entry) => !entry.final);
  }

  ingest(rows) {
    const list = Array.isArray(rows) ? rows : [rows];

    list.forEach((row) => {
      if (row && typeof row === 'object') {
        this.#ingestRow(row);
      }
    });
  }

  #ingestRow(row) {
    let entry = null;
    let matchedBy = null;

    if (present(row.commandId)) {
      entry = this.state.entries.find((candidate) => candidate.commandId === row.commandId);
      matchedBy = 'commandId';
    }

    if (!entry && present(row.request_id)) {
      entry = this.state.entries.find((candidate) => candidate.requestId === row.request_id);
      matchedBy = entry?.matchedBy ?? null;
    }

    if (!entry) {
      entry = this.#matchBySessionAndStem(row);
      matchedBy = 'session';
    }

    if (!entry) {
      return;
    }

    if (present(row.status)) {
      entry.status = row.status;
    }

    if (present(row.fail_reason)) {
      entry.failReason = row.fail_reason;
    }

    if (present(row.scmf_file)) {
      entry.scmfFile = row.scmf_file;
    }

    if (present(row.request_id)) {
      entry.requestId = row.request_id;
    }

    if (present(row.event_time)) {
      entry.eventTime = row.event_time;
    }

    entry.final = entry.final || isTrue(row.final) || isTrue(row.finalized);
    entry.matchedBy = entry.matchedBy === 'commandId' ? 'commandId' : matchedBy;
  }

  #matchBySessionAndStem(row) {
    const stem = commandStem(row.command_string);
    const eventTime = parseEventTime(row.event_time);

    if (!stem) {
      return null;
    }

    for (let index = this.state.entries.length - 1; index >= 0; index--) {
      const candidate = this.state.entries[index];

      if (candidate.final || present(candidate.requestId) || candidate.stem !== stem) {
        continue;
      }

      if (!present(row.session_id) || String(candidate.sessionId) !== String(row.session_id)) {
        continue;
      }

      const dispatchTime = parseEventTime(candidate.dispatchTime);

      if (
        eventTime !== null &&
        dispatchTime !== null &&
        eventTime < dispatchTime - this.matchWindowMs
      ) {
        continue;
      }

      return candidate;
    }

    return null;
  }
}
