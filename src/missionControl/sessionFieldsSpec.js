import {
  assignFreeValues,
  conflictingSession,
  describeParameters,
  initialValues,
  lockedValues,
  nextFreeValue,
  normalizeFields,
  toParameters,
  validateSessionValues
} from './sessionFields.js';

describe('sessionFields', () => {
  const downlinkConfig = [
    {
      key: 'venueType',
      name: 'Venue',
      options: ['TESTSET', 'ATLO'],
      default: 'TESTSET',
      required: true
    },
    {
      key: 'fswDownlinkHost',
      name: 'Host',
      options: [
        { value: 'localhost', label: 'Local Connection' },
        {
          value: 'netacq.example.com',
          label: 'SSE1 NetAcquire',
          sets: { fswDownlinkPort: 10412 }
        }
      ]
    },
    {
      key: 'fswDownlinkPort',
      name: 'Port',
      control: 'number',
      min: 9828,
      max: 9830,
      unique: true,
      uniqueAmong: ['fswDownlinkHost'],
      autoAssign: true,
      required: true
    },
    { key: 'testbedName', name: 'Testbed', control: 'text', pattern: '^[A-Z0-9_]*$' },
    { key: '', name: 'ignored' },
    { name: 'no key' }
  ];
  const fields = normalizeFields(downlinkConfig);
  const port = fields.find((field) => field.key === 'fswDownlinkPort');
  const localSession = (sessionId, portValue) => ({
    sessionId,
    parameters: { fswDownlinkHost: 'localhost', fswDownlinkPort: portValue }
  });

  describe('normalizeFields', () => {
    it('drops fields without a key and fills in defaults', () => {
      expect(fields.map((field) => field.key)).toEqual([
        'venueType',
        'fswDownlinkHost',
        'fswDownlinkPort',
        'testbedName'
      ]);
      expect(fields[0].control).toBe('select');
      expect(fields[0].options[0]).toEqual({ value: 'TESTSET', label: 'TESTSET', sets: {} });
      expect(fields[3]).toEqual(
        jasmine.objectContaining({ control: 'text', required: false, unique: false })
      );
    });

    it('treats a non-array config as no fields', () => {
      expect(normalizeFields(undefined)).toEqual([]);
      expect(normalizeFields({ key: 'venueType' })).toEqual([]);
    });
  });

  describe('initial values and auto-assignment', () => {
    it('uses defaults, first options, and the lowest free port', () => {
      expect(initialValues(fields, [localSession(4, 9828)])).toEqual({
        venueType: 'TESTSET',
        fswDownlinkHost: 'localhost',
        fswDownlinkPort: 9829,
        testbedName: ''
      });
    });

    it('only counts sessions on the same host as conflicts', () => {
      const values = { fswDownlinkHost: 'localhost' };
      const remote = {
        sessionId: 5,
        parameters: { fswDownlinkHost: 'other', fswDownlinkPort: 9828 }
      };

      expect(conflictingSession(port, 9828, values, [remote])).toBe(null);
      expect(conflictingSession(port, '9828', values, [localSession(4, 9828)]).sessionId).toBe(4);
    });

    it('returns null when every port in the range is taken', () => {
      const sessions = [localSession(1, 9828), localSession(2, 9829), localSession(3, 9830)];

      expect(nextFreeValue(port, { fswDownlinkHost: 'localhost' }, sessions)).toBe(null);
    });

    it('locks fields set by the chosen option', () => {
      const values = assignFreeValues(fields, {
        venueType: 'TESTSET',
        fswDownlinkHost: 'netacq.example.com',
        fswDownlinkPort: 9828
      });

      expect(lockedValues(fields, values)).toEqual({ fswDownlinkPort: 10412 });
      expect(values.fswDownlinkPort).toBe(10412);
    });

    it('reassigns a port left out of range when a lock is released', () => {
      const values = assignFreeValues(fields, {
        venueType: 'TESTSET',
        fswDownlinkHost: 'localhost',
        fswDownlinkPort: 10412
      });

      expect(values.fswDownlinkPort).toBe(9828);
    });
  });

  describe('validateSessionValues', () => {
    const valid = {
      venueType: 'TESTSET',
      fswDownlinkHost: 'localhost',
      fswDownlinkPort: 9829,
      testbedName: ''
    };

    it('accepts valid values', () => {
      expect(validateSessionValues(fields, valid, [localSession(4, 9828)])).toEqual({
        valid: true,
        errors: {}
      });
    });

    it('reports required, range, option, pattern, and uniqueness errors', () => {
      const { valid: ok, errors } = validateSessionValues(
        fields,
        {
          venueType: 'MARS',
          fswDownlinkHost: 'localhost',
          fswDownlinkPort: 9828,
          testbedName: 'bad name'
        },
        [localSession(4, 9828)]
      );

      expect(ok).toBe(false);
      expect(errors).toEqual({
        venueType: 'Choose one of the listed values',
        fswDownlinkPort: 'In use by session 4',
        testbedName: 'Invalid format'
      });

      expect(validateSessionValues(fields, { ...valid, fswDownlinkPort: '' }).errors).toEqual({
        fswDownlinkPort: 'Value required'
      });
      expect(validateSessionValues(fields, { ...valid, fswDownlinkPort: 9900 }).errors).toEqual({
        fswDownlinkPort: 'Must be <= 9830'
      });
    });
  });

  describe('toParameters and describeParameters', () => {
    it('sends typed values and leaves out empty optional fields', () => {
      expect(
        toParameters(fields, {
          venueType: 'TESTSET',
          fswDownlinkHost: 'localhost',
          fswDownlinkPort: '9829',
          testbedName: ''
        })
      ).toEqual({ venueType: 'TESTSET', fswDownlinkHost: 'localhost', fswDownlinkPort: 9829 });
    });

    it('labels parameters with configured names and option labels', () => {
      expect(
        describeParameters(fields, {
          fswDownlinkHost: 'netacq.example.com',
          fswDownlinkPort: 10412,
          extra: 'x'
        })
      ).toEqual([
        { key: 'fswDownlinkHost', label: 'Host', value: 'SSE1 NetAcquire' },
        { key: 'fswDownlinkPort', label: 'Port', value: '10412' },
        { key: 'extra', label: 'extra', value: 'x' }
      ]);
    });
  });
});
