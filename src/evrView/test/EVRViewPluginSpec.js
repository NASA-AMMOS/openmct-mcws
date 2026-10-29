import EVRViewPlugin from '../plugin.js';

describe('EVRViewPlugin', () => {
  it('registers the three EVR historical data actions and the pause countdown action', () => {
    const openmct = {
      objectViews: { addProvider: jasmine.createSpy('addProvider') },
      actions: { register: jasmine.createSpy('register') },
      types: { addType: jasmine.createSpy('addType') },
      inspectorViews: { addProvider: jasmine.createSpy('addProvider') },
      composition: { addPolicy: jasmine.createSpy('addPolicy') }
    };

    EVRViewPlugin({ taxonomy: {}, tablePerformanceOptions: {} })(openmct);

    const registeredKeys = openmct.actions.register.calls.allArgs().map(([action]) => action.key);

    expect(registeredKeys).toEqual([
      'vista.evr.view-historical-level',
      'vista.evr.view-historical-module',
      'vista.evr.view-historical-evr',
      'vista.evr.pause-countdown'
    ]);
  });

  it('initializes new EVR views with the pause timer unset', () => {
    const openmct = {
      objectViews: { addProvider: jasmine.createSpy('addProvider') },
      actions: { register: jasmine.createSpy('register') },
      types: { addType: jasmine.createSpy('addType') },
      inspectorViews: { addProvider: jasmine.createSpy('addProvider') },
      composition: { addPolicy: jasmine.createSpy('addPolicy') }
    };

    EVRViewPlugin({ taxonomy: {}, tablePerformanceOptions: {} })(openmct);

    const typeDefinition = openmct.types.addType.calls.mostRecent().args[1];
    const domainObject = {};
    typeDefinition.initialize(domainObject);

    expect(domainObject.configuration.pauseTimerSeconds).toBeNull();
  });
});
