import EVRHistoricalDataActions from '../EVRHistoricalDataActions.js';
import types from '../../types/types.js';

describe('EVRHistoricalDataActions', () => {
  let openmct;
  let baseAction;
  let datasetIdentifier;
  let backingDomainObject;
  let objectPath;
  let datum;
  let view;
  let actions;
  let levelAction;
  let moduleAction;
  let evrAction;

  beforeEach(() => {
    datasetIdentifier = { namespace: 'vista', key: 'DATASET1' };
    backingDomainObject = {
      type: 'vista.evrSource',
      identifier: types.EVRSource.makeIdentifier(datasetIdentifier)
    };
    objectPath = [backingDomainObject, { type: 'vista.evrView' }];
    datum = {};

    view = {
      getViewContext: () => ({
        row: {
          getDatum: () => datum
        }
      })
    };

    baseAction = jasmine.createSpyObj('viewHistoricalData', ['invoke']);
    baseAction.invoke.and.returnValue(Promise.resolve());

    openmct = {
      actions: {
        getAction: jasmine.createSpy('getAction').and.returnValue(baseAction)
      },
      objects: {
        makeKeyString: (identifier) => `${identifier.namespace}:${identifier.key}`,
        get: jasmine.createSpy('get').and.returnValue(Promise.resolve(undefined))
      }
    };

    actions = EVRHistoricalDataActions(openmct);
    [levelAction, moduleAction, evrAction] = actions;
  });

  describe('appliesTo', () => {
    it('returns false when there is no domain object', () => {
      expect(levelAction.appliesTo([], view)).toBe(false);
    });

    it('returns false when the domain object is not an EVR telemetry type', () => {
      const nonEvrPath = [{ type: 'vista.dataset', identifier: datasetIdentifier }];
      expect(levelAction.appliesTo(nonEvrPath, view)).toBe(false);
    });

    it('returns false when there is no clicked-row context', () => {
      const noRowView = { getViewContext: () => ({}) };
      expect(levelAction.appliesTo(objectPath, noRowView)).toBe(false);
    });

    it('returns true for an EVR telemetry type with a clicked-row context', () => {
      expect(levelAction.appliesTo(objectPath, view)).toBe(true);
    });

    it('is shared across all three actions', () => {
      expect(moduleAction.appliesTo).toBe(levelAction.appliesTo);
      expect(evrAction.appliesTo).toBe(levelAction.appliesTo);
    });
  });

  describe('View Historical Level', () => {
    it('resolves the uppercased level and delegates with the resolved object', async () => {
      datum.level = 'activity_hi';
      const resolvedLevelObject = { name: 'Level: ACTIVITY_HI', type: 'vista.evrModule' };
      openmct.objects.get.and.returnValue(Promise.resolve(resolvedLevelObject));

      await levelAction.invoke(objectPath, view);

      const expectedIdentifier = types.EVRModule.makeIdentifier('ACTIVITY_HI', datasetIdentifier);
      const expectedKeyString = openmct.objects.makeKeyString(expectedIdentifier);

      expect(openmct.objects.get).toHaveBeenCalledWith(expectedKeyString);
      expect(baseAction.invoke).toHaveBeenCalledWith(
        [resolvedLevelObject, objectPath[1]],
        view
      );
    });

    it('falls back to the base action unchanged when the row has no level', async () => {
      datum.level = undefined;

      await levelAction.invoke(objectPath, view);

      expect(openmct.objects.get).not.toHaveBeenCalled();
      expect(baseAction.invoke).toHaveBeenCalledWith(objectPath, view);
    });

    it('falls back to the base action unchanged when the resolved object is not found', async () => {
      datum.level = 'activity_hi';
      openmct.objects.get.and.returnValue(Promise.resolve(undefined));

      await levelAction.invoke(objectPath, view);

      expect(baseAction.invoke).toHaveBeenCalledWith(objectPath, view);
    });

    it('falls back to the base action unchanged when the dataset identifier cannot be resolved', async () => {
      datum.level = 'activity_hi';
      objectPath = [{ type: 'vista.evrSource', identifier: { namespace: 'vista', key: 'nonsense' } }];

      await levelAction.invoke(objectPath, view);

      expect(openmct.objects.get).not.toHaveBeenCalled();
      expect(baseAction.invoke).toHaveBeenCalledWith(objectPath, view);
    });
  });

  describe('View Historical Module', () => {
    it('resolves the uppercased module and delegates with the resolved object', async () => {
      datum.module = 'test_cbm';
      const resolvedModuleObject = { name: 'TEST_CBM', type: 'vista.evrModule' };
      openmct.objects.get.and.returnValue(Promise.resolve(resolvedModuleObject));

      await moduleAction.invoke(objectPath, view);

      const expectedIdentifier = types.EVRModule.makeIdentifier('TEST_CBM', datasetIdentifier);
      const expectedKeyString = openmct.objects.makeKeyString(expectedIdentifier);

      expect(openmct.objects.get).toHaveBeenCalledWith(expectedKeyString);
      expect(baseAction.invoke).toHaveBeenCalledWith(
        [resolvedModuleObject, objectPath[1]],
        view
      );
    });

    it('falls back to the base action unchanged when the row has no module', async () => {
      datum.module = undefined;

      await moduleAction.invoke(objectPath, view);

      expect(openmct.objects.get).not.toHaveBeenCalled();
      expect(baseAction.invoke).toHaveBeenCalledWith(objectPath, view);
    });
  });

  describe('View Historical EVR', () => {
    it('resolves the uppercased EVR name and delegates with the resolved object', async () => {
      datum.name = 'log_message';
      const resolvedEvrObject = { name: 'LOG_MESSAGE', type: 'vista.evr' };
      openmct.objects.get.and.returnValue(Promise.resolve(resolvedEvrObject));

      await evrAction.invoke(objectPath, view);

      const expectedIdentifier = types.EVR.makeIdentifier(datasetIdentifier, 'LOG_MESSAGE');
      const expectedKeyString = openmct.objects.makeKeyString(expectedIdentifier);

      expect(openmct.objects.get).toHaveBeenCalledWith(expectedKeyString);
      expect(baseAction.invoke).toHaveBeenCalledWith(
        [resolvedEvrObject, objectPath[1]],
        view
      );
    });

    it('falls back to the base action unchanged when the row has no name', async () => {
      datum.name = undefined;

      await evrAction.invoke(objectPath, view);

      expect(openmct.objects.get).not.toHaveBeenCalled();
      expect(baseAction.invoke).toHaveBeenCalledWith(objectPath, view);
    });
  });
});
