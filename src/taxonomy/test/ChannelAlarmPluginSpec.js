import ChannelAlarmPlugin from '../ChannelAlarmPlugin.js';
import types from '../../types/types.js';

describe('ChannelAlarmPlugin', () => {
  let openmct;
  let cache;
  let originalInvokeSpy;
  let domainObject;
  let objectPath;
  let datum;
  let view;

  beforeEach(() => {
    originalInvokeSpy = jasmine
      .createSpy('viewHistoricalData.invoke')
      .and.returnValue(Promise.resolve());
    const action = { invoke: originalInvokeSpy };

    cache = jasmine.createSpyObj('cache', ['get']);

    openmct = {
      actions: {
        getAction: jasmine.createSpy('getAction').and.returnValue(action)
      },
      types: {
        addType: jasmine.createSpy('addType')
      },
      composition: {
        addProvider: jasmine.createSpy('addProvider')
      },
      objects: {
        addProvider: jasmine.createSpy('addProvider'),
        get: jasmine.createSpy('get').and.returnValue(Promise.resolve(undefined)),
        makeKeyString: (identifier) => `${identifier.namespace}:${identifier.key}`
      },
      objectViews: {
        get: () => []
      }
    };

    ChannelAlarmPlugin([], cache)(openmct);

    domainObject = {
      type: 'vista.channel.alarmNode',
      identifier: { namespace: 'vista-channel-alarms', key: 'vista:DATASET1:any' }
    };
    objectPath = [domainObject, { type: 'vista.dataset' }];
    datum = { channel_id: '12345' };
    view = {
      getViewContext: () => ({
        row: {
          getDatum: () => datum
        }
      })
    };
  });

  function invokePatched(path, viewArg) {
    return openmct.actions.getAction('viewHistoricalData').invoke(path, viewArg);
  }

  it('leaves non-alarm-node objectPaths untouched', async () => {
    const otherPath = [{ type: 'vista.dataset' }];

    await invokePatched(otherPath, view);

    expect(cache.get).not.toHaveBeenCalled();
    expect(originalInvokeSpy).toHaveBeenCalledWith(otherPath, view);
  });

  it('falls back to the original invoke when there is no row datum', async () => {
    datum.channel_id = undefined;

    await invokePatched(objectPath, view);

    expect(cache.get).not.toHaveBeenCalled();
    expect(originalInvokeSpy).toHaveBeenCalledWith(objectPath, view);
  });

  it('resolves the channel named in the row datum and delegates with it swapped in', async () => {
    const dataset = { identifier: { namespace: 'vista', key: 'DATASET1' } };
    cache.get.and.returnValue(Promise.resolve(dataset));
    const resolvedChannel = { name: '12345 - Some Channel' };
    openmct.objects.get.and.returnValue(Promise.resolve(resolvedChannel));

    await invokePatched(objectPath, view);

    const channelType = types.typeForKey('vista.channel');
    const expectedKeyString = 'vista:' + channelType.makeId(dataset.identifier, datum.channel_id);

    expect(cache.get).toHaveBeenCalledWith({ namespace: 'vista', key: 'DATASET1' });
    expect(openmct.objects.get).toHaveBeenCalledWith(expectedKeyString);
    expect(originalInvokeSpy).toHaveBeenCalledWith([resolvedChannel, objectPath[1]], view);
  });

  it('falls back to the original objectPath when the channel cannot be resolved', async () => {
    const dataset = { identifier: { namespace: 'vista', key: 'DATASET1' } };
    cache.get.and.returnValue(Promise.resolve(dataset));
    openmct.objects.get.and.returnValue(Promise.resolve(undefined));

    await invokePatched(objectPath, view);

    expect(originalInvokeSpy).toHaveBeenCalledWith(objectPath, view);
  });

  it('does not wrap invoke a second time once already patched', () => {
    const action = openmct.actions.getAction('viewHistoricalData');
    const patchedInvoke = action.invoke;

    ChannelAlarmPlugin([], cache)(openmct);

    expect(action.invoke).toBe(patchedInvoke);
  });
});
