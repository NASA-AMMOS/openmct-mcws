import SessionURLHandler from './SessionURLHandler.js';

describe('SessionURLHandler', () => {
  let openmct;
  let sessionService;
  let searchParams;
  let paramsChangeCallback;

  function makeServiceState() {
    return {
      historicalFilter: undefined,
      realtimeSession: undefined
    };
  }

  let state;

  beforeEach(() => {
    state = makeServiceState();
    searchParams = {};
    paramsChangeCallback = undefined;

    openmct = {
      router: {
        on: jasmine.createSpy('on').and.callFake((event, callback) => {
          if (event === 'change:params') {
            paramsChangeCallback = callback;
          }
        }),
        getSearchParam: (name) =>
          Object.prototype.hasOwnProperty.call(searchParams, name) ? searchParams[name] : null,
        setSearchParam: jasmine.createSpy('setSearchParam').and.callFake((name, value) => {
          searchParams[name] = String(value);
        }),
        deleteSearchParam: jasmine.createSpy('deleteSearchParam').and.callFake((name) => {
          delete searchParams[name];
        })
      }
    };

    sessionService = {
      historicalSessionFilterConfig: { disable: false },
      realtimeSessionConfig: { disable: false },
      listen: jasmine.createSpy('listen'),
      listenForHistoricalChange: jasmine.createSpy('listenForHistoricalChange'),
      getHistoricalSessionFilter: () => state.historicalFilter,
      setHistoricalSessionFilter: jasmine
        .createSpy('setHistoricalSessionFilter')
        .and.callFake((filter) => {
          state.historicalFilter = filter;
        }),
      getActiveTopicOrSession: () => state.realtimeSession,
      setActiveTopicOrSession: jasmine
        .createSpy('setActiveTopicOrSession')
        .and.callFake((session) => {
          state.realtimeSession = session;
        })
    };
  });

  it('applies the historical session filter from the URL over the current filter', () => {
    state.historicalFilter = { numbers: [1244], host: 'testbed1' };
    searchParams = { v_hsi: '1220', v_hsh: 'testbed1' };

    new SessionURLHandler(sessionService, openmct);

    expect(sessionService.setHistoricalSessionFilter).toHaveBeenCalledWith({
      numbers: [1220],
      host: 'testbed1'
    });
  });

  it('applies the historical session filter from the URL on navigation', () => {
    state.historicalFilter = { numbers: [1220], host: 'testbed1' };
    searchParams = { v_hsi: '1220', v_hsh: 'testbed1' };
    new SessionURLHandler(sessionService, openmct);
    sessionService.setHistoricalSessionFilter.calls.reset();

    searchParams = { v_hsi: '1244,1393', v_hsh: 'testbed2' };
    paramsChangeCallback();

    expect(sessionService.setHistoricalSessionFilter).toHaveBeenCalledWith({
      numbers: [1244, 1393],
      host: 'testbed2'
    });
  });

  it('does not reapply the historical filter when the URL already matches it', () => {
    state.historicalFilter = { numbers: [1220], host: 'testbed1' };
    searchParams = { v_hsi: '1220', v_hsh: 'testbed1' };

    new SessionURLHandler(sessionService, openmct);

    expect(sessionService.setHistoricalSessionFilter).not.toHaveBeenCalled();
  });

  it('selects the realtime session from the URL when only its topic is active', () => {
    state.realtimeSession = { topic: 'ampcs.vista.testbed.dsanto' };
    searchParams = {
      v_rt: 'ampcs.vista.testbed.dsanto',
      v_rsi: '1393',
      v_rfsw: '1.3.0235'
    };

    new SessionURLHandler(sessionService, openmct);

    expect(sessionService.setActiveTopicOrSession).toHaveBeenCalledWith(
      jasmine.objectContaining({ topic: 'ampcs.vista.testbed.dsanto', number: 1393 })
    );
  });

  it('selects the realtime session from the URL over a different active session', () => {
    state.realtimeSession = {
      topic: 'ampcs.vista.testbed.peterr',
      number: 1244,
      fsw_version: '1.3.0235'
    };
    searchParams = {
      v_rt: 'ampcs.vista.testbed.dsanto',
      v_rsi: '1393',
      v_rfsw: '1.3.0235'
    };

    new SessionURLHandler(sessionService, openmct);

    expect(sessionService.setActiveTopicOrSession).toHaveBeenCalledWith(
      jasmine.objectContaining({ topic: 'ampcs.vista.testbed.dsanto', number: 1393 })
    );
  });

  it('applies a realtime fsw version change from the URL', () => {
    state.realtimeSession = {
      topic: 'ampcs.vista.testbed.dsanto',
      number: 1393,
      fsw_version: 'old'
    };
    searchParams = {
      v_rt: 'ampcs.vista.testbed.dsanto',
      v_rsi: '1393',
      v_rfsw: 'new'
    };

    new SessionURLHandler(sessionService, openmct);

    expect(sessionService.setActiveTopicOrSession).toHaveBeenCalledWith(
      jasmine.objectContaining({ fsw_version: 'new' })
    );
  });

  it('does not reselect the realtime session when the URL already matches it', () => {
    state.realtimeSession = {
      topic: 'ampcs.vista.testbed.dsanto',
      number: 1393,
      fsw_version: '1.3.0235'
    };
    searchParams = {
      v_rt: 'ampcs.vista.testbed.dsanto',
      v_rsi: '1393',
      v_rfsw: '1.3.0235'
    };

    new SessionURLHandler(sessionService, openmct);

    expect(sessionService.setActiveTopicOrSession).not.toHaveBeenCalled();
  });

  it('strips session params from the URL when historical filtering is disabled', () => {
    sessionService.historicalSessionFilterConfig.disable = true;
    searchParams = { v_hsi: '1220', v_hsh: 'testbed1' };

    new SessionURLHandler(sessionService, openmct);

    expect(sessionService.setHistoricalSessionFilter).not.toHaveBeenCalled();
    expect(openmct.router.deleteSearchParam).toHaveBeenCalledWith('v_hsi');
    expect(openmct.router.deleteSearchParam).toHaveBeenCalledWith('v_hsh');
  });

  it('strips realtime params from the URL when realtime sessions are disabled', () => {
    sessionService.realtimeSessionConfig.disable = true;
    searchParams = { v_rt: 'ampcs.vista.testbed.dsanto', v_rsi: '1393' };

    new SessionURLHandler(sessionService, openmct);

    expect(sessionService.setActiveTopicOrSession).not.toHaveBeenCalled();
    expect(openmct.router.deleteSearchParam).toHaveBeenCalledWith('v_rt');
    expect(openmct.router.deleteSearchParam).toHaveBeenCalledWith('v_rsi');
  });
});
