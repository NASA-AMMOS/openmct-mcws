import EVRDictionary from '../EVRDictionary.js';

describe('EVRDictionary', () => {
  let evrDictionary;

  beforeEach(() => {
    // Construct without running the real constructor (which wires up SessionService),
    // and mark as already loaded so load() resolves immediately without hitting mcws.
    evrDictionary = Object.create(EVRDictionary.prototype);
    evrDictionary.loaded = true;
    evrDictionary.byModule = { TEST_CBM: ['TEST_CBM_EVR_BKGD_DONE'] };
    evrDictionary.byName = {
      TEST_CBM_EVR_BKGD_DONE: { evr_name: 'TEST_CBM_EVR_BKGD_DONE', module: 'TEST_CBM' }
    };
    evrDictionary.byNameUpper = {
      TEST_CBM_EVR_BKGD_DONE: evrDictionary.byName.TEST_CBM_EVR_BKGD_DONE
    };
  });

  describe('getModuleEVRs', () => {
    it('resolves the EVR names for a known module', async () => {
      const result = await evrDictionary.getModuleEVRs('TEST_CBM');

      expect(result).toEqual(['TEST_CBM_EVR_BKGD_DONE']);
    });

    it('resolves an empty array for an unknown module instead of undefined', async () => {
      const result = await evrDictionary.getModuleEVRs('NOT_A_MODULE');

      expect(result).toEqual([]);
    });
  });

  describe('getEVRByName', () => {
    it('finds an EVR by an exact-case name match', () => {
      expect(evrDictionary.getEVRByName('TEST_CBM_EVR_BKGD_DONE').module).toBe('TEST_CBM');
    });

    it('falls back to a case-insensitive match when the exact case is not found', () => {
      expect(evrDictionary.getEVRByName('test_cbm_evr_bkgd_done').module).toBe('TEST_CBM');
    });

    it('returns undefined when there is no match at all', () => {
      expect(evrDictionary.getEVRByName('NOT_AN_EVR')).toBeUndefined();
    });
  });
});
