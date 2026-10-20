import HistoricalSessionMetadata, {
  getHistoricalSessionValues
} from './HistoricalSessionMetadata.js';

describe('HistoricalSessionMetadata', () => {
  it('labels the legacy ERT columns with the ERT suffix but unchanged fields', () => {
    const byKey = Object.fromEntries(
      getHistoricalSessionValues('ert').map((value) => [value.key, value])
    );

    expect(byKey.start_time.name).toBe('Start Time ERT');
    expect(byKey.start_time.source).toBe('start_time');
    expect(byKey.end_time.name).toBe('End Time ERT');
    expect(byKey.end_time.source).toBe('end_time');
  });

  it('adds no extra columns for ERT', () => {
    expect(getHistoricalSessionValues('ert').length).toBe(9);
  });

  it('appends the SCET column pair for the SCET time system', () => {
    const values = getHistoricalSessionValues('scet');

    expect(values.length).toBe(11);
    expect(values[9]).toEqual({
      key: 'start_time_scet',
      name: 'Start Time SCET',
      source: 'start_time_scet'
    });
    expect(values[10]).toEqual({
      key: 'end_time_scet',
      name: 'End Time SCET',
      source: 'end_time_scet'
    });
  });

  it('appends the SCLK column pair for the SCLK time system', () => {
    const values = getHistoricalSessionValues('sclk');

    expect(values.length).toBe(11);
    expect(values[9].key).toBe('start_time_sclk');
    expect(values[9].name).toBe('Start Time SCLK');
    expect(values[10].key).toBe('end_time_sclk');
    expect(values[10].name).toBe('End Time SCLK');
  });

  it('returns fresh objects on every call', () => {
    const first = getHistoricalSessionValues('ert');
    const second = getHistoricalSessionValues('ert');

    expect(first).not.toBe(second);
    expect(first[0]).not.toBe(second[0]);
  });

  it('defaults to the ERT columns', () => {
    expect(HistoricalSessionMetadata.values).toEqual(getHistoricalSessionValues('ert'));
  });
});
