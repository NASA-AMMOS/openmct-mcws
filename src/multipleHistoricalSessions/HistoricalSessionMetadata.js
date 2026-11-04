import { getSessionTimeFields } from './sessionSelector/sessionSnapBounds.js';

const BASE_VALUES = [
  {
    key: 'number',
    name: 'ID',
    source: 'number'
  },
  {
    key: 'user',
    name: 'User',
    source: 'user'
  },
  {
    key: 'host',
    name: 'Host',
    source: 'host'
  },
  {
    key: 'name',
    name: 'Name',
    source: 'name'
  },
  {
    key: 'description',
    name: 'Description',
    source: 'description'
  },
  {
    key: 'start_time',
    name: 'Start Time ERT',
    source: 'start_time'
  },
  {
    key: 'end_time',
    name: 'End Time ERT',
    source: 'end_time'
  },
  {
    key: 'downlink_stream_id',
    name: 'Downlink Stream ID',
    source: 'downlink_stream_id'
  },
  {
    key: 'spacecraft_id',
    name: 'Spacecraft ID',
    source: 'spacecraft_id'
  }
];

/**
 * Session table columns for the active time system (#347). The legacy ERT
 * start/end columns are always present; other systems append their own
 * start/end pair. The pair is always appended (even when no row carries the
 * fields) because columns build before the session rows arrive.
 */
export function getHistoricalSessionValues(timeSystemKey) {
  const values = BASE_VALUES.map((value) => ({ ...value }));

  if (timeSystemKey && timeSystemKey !== 'ert') {
    const [startField, endField] = getSessionTimeFields(timeSystemKey);
    const label = timeSystemKey.toUpperCase();

    values.push(
      {
        key: startField,
        name: `Start Time ${label}`,
        source: startField
      },
      {
        key: endField,
        name: `End Time ${label}`,
        source: endField
      }
    );
  }

  return values;
}

export default {
  values: getHistoricalSessionValues('ert')
};
