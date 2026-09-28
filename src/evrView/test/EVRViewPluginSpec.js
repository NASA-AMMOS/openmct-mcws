import EVRViewPlugin from '../plugin.js';

describe('EVRViewPlugin', () => {
  it('registers the three EVR historical data actions', () => {
    const openmct = {
      objectViews: { addProvider: jasmine.createSpy('addProvider') },
      actions: { register: jasmine.createSpy('register') },
      types: { addType: jasmine.createSpy('addType') },
      inspectorViews: { addProvider: jasmine.createSpy('addProvider') },
      composition: { addPolicy: jasmine.createSpy('addPolicy') }
    };

    EVRViewPlugin({ taxonomy: {}, tablePerformanceOptions: {} })(openmct);

    const registeredKeys = openmct.actions.register.calls
      .allArgs()
      .map(([action]) => action.key);

    expect(registeredKeys).toEqual([
      'vista.evr.view-historical-level',
      'vista.evr.view-historical-module',
      'vista.evr.view-historical-evr'
    ]);
  });
});
