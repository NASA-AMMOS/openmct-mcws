import getMissionControlService, {
  MissionControlService
} from './missionControlService.js';

describe('MissionControlService', () => {
  const API_BASE = '/test-api';
  let service;
  let fetchSpy;

  function jsonResponse(body, status = 200) {
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
      text: async () => JSON.stringify(body)
    };
  }

  function lastFetch() {
    const [url, options] = fetchSpy.calls.mostRecent().args;

    return { url, options, body: options.body ? JSON.parse(options.body) : undefined };
  }

  beforeEach(() => {
    service = new MissionControlService(undefined, API_BASE);
    fetchSpy = spyOn(window, 'fetch');
  });

  it('returns a shared singleton from the getter', () => {
    expect(getMissionControlService()).toBe(getMissionControlService());
    expect(new MissionControlService()).not.toBe(getMissionControlService());
  });

  it('cannot send with no selection', () => {
    expect(service.canSendCommands()).toBe(false);
  });

  it('can send once an attached session is selected', async () => {
    fetchSpy.and.resolveTo(jsonResponse([{ sessionId: 7 }]));
    await service.refreshUplinkSessions();
    service.selectUplinkSession(7);

    expect(service.canSendCommands()).toBe(true);
  });

  it('cannot send when the selection is not attached', () => {
    service.selectUplinkSession(7);

    expect(service.canSendCommands()).toBe(false);
  });

  it('clears a stale selection on refresh', async () => {
    fetchSpy.and.resolveTo(jsonResponse([{ sessionId: 7 }]));
    await service.refreshUplinkSessions();
    service.selectUplinkSession(7);
    fetchSpy.and.resolveTo(jsonResponse([{ sessionId: 9 }]));
    await service.refreshUplinkSessions();

    expect(service.selectedUplinkSessionId).toBe(null);
    expect(service.canSendCommands()).toBe(false);
  });

  it('sends credentials with every request', async () => {
    fetchSpy.and.resolveTo(jsonResponse([]));
    await service.refreshUplinkSessions();

    expect(lastFetch().options.credentials).toBe('include');
  });

  it('starts uplink sessions with defaults and selects the first', async () => {
    fetchSpy.and.resolveTo(jsonResponse([{ sessionId: 7 }, { sessionId: 9 }]));
    const started = await service.startUplinkSessions([7, 9]);
    const post = fetchSpy.calls.argsFor(0);

    expect(post[0]).toBe(`${API_BASE}/command-sessions`);
    expect(post[1].method).toBe('POST');
    expect(JSON.parse(post[1].body)).toEqual({
      sessionIds: [7, 9],
      defaultTarget: 'AB',
      timeout: 30
    });
    expect(started).toEqual([{ sessionId: 7 }, { sessionId: 9 }]);
    expect(service.state.uplinkSessions).toEqual([{ sessionId: 7 }, { sessionId: 9 }]);
    expect(service.selectedUplinkSessionId).toBe(7);
  });

  it('keeps an existing selection when starting more sessions', async () => {
    fetchSpy.and.resolveTo(jsonResponse([{ sessionId: 7 }]));
    await service.refreshUplinkSessions();
    service.selectUplinkSession(7);
    fetchSpy.and.resolveTo(jsonResponse([{ sessionId: 7 }, { sessionId: 9 }]));
    await service.startUplinkSessions([9]);

    expect(service.selectedUplinkSessionId).toBe(7);
  });

  it('stops uplink sessions and clears state', async () => {
    fetchSpy.and.resolveTo(jsonResponse([{ sessionId: 7 }]));
    await service.refreshUplinkSessions();
    service.selectUplinkSession(7);
    fetchSpy.and.resolveTo({ ok: true, status: 204 });
    await service.stopUplinkSessions();

    expect(lastFetch().options.method).toBe('DELETE');
    expect(service.state.uplinkSessions).toEqual([]);
    expect(service.selectedUplinkSessionId).toBe(null);
  });

  it('manages downlink sessions', async () => {
    fetchSpy.and.resolveTo(jsonResponse([{ sessionId: 3 }]));
    await service.startDownlinkSessions([3]);

    expect(fetchSpy.calls.argsFor(0)[0]).toBe(`${API_BASE}/downlink-sessions`);
    expect(JSON.parse(fetchSpy.calls.argsFor(0)[1].body)).toEqual({ sessionIds: [3] });
    expect(service.state.downlinkSessions).toEqual([{ sessionId: 3 }]);

    fetchSpy.and.resolveTo({ ok: true, status: 204 });
    await service.stopDownlinkSessions();

    expect(service.state.downlinkSessions).toEqual([]);
  });

  it('refreshes tracking sessions', async () => {
    const rows = [{ number: 7, topic: 't', host: 'h' }];
    fetchSpy.and.resolveTo(jsonResponse(rows));
    await service.refreshTrackingSessions();

    expect(lastFetch().url).toBe(`${API_BASE}/sessions/active`);
    expect(service.state.trackingSessions).toEqual(rows);
  });

  it('sends flight software commands unverified (client verified)', async () => {
    fetchSpy.and.resolveTo(jsonResponse({ commandId: 'c1' }));
    const dispatch = await service.sendFlightSoftwareCommand({
      sessionId: 7,
      commandString: 'FSW_SET_MODE,CLEAR_A'
    });

    expect(lastFetch().url).toBe(`${API_BASE}/commands/flight-software`);
    expect(lastFetch().body).toEqual({
      sessionId: 7,
      commandString: 'FSW_SET_MODE,CLEAR_A',
      validate: false
    });
    expect(dispatch).toEqual({ commandId: 'c1' });
  });

  it('sends hardware commands by stem', async () => {
    fetchSpy.and.resolveTo(jsonResponse({ commandId: 'c2' }));
    await service.sendHardwareCommand({ sessionId: 7, commandStem: 'HDW_POWER_ON' });

    expect(lastFetch().url).toBe(`${API_BASE}/commands/hardware`);
    expect(lastFetch().body).toEqual({ sessionId: 7, commandStem: 'HDW_POWER_ON' });
  });

  it('sends simulator commands by string', async () => {
    fetchSpy.and.resolveTo(jsonResponse({ commandId: 'c3' }));
    await service.sendSimulatorCommand({ sessionId: 7, commandString: 'SIM_NOOP' });

    expect(lastFetch().url).toBe(`${API_BASE}/commands/simulator`);
    expect(lastFetch().body).toEqual({ sessionId: 7, commandString: 'SIM_NOOP' });
  });

  it('records failures on state and rethrows', async () => {
    fetchSpy.and.resolveTo({
      ok: false,
      status: 400,
      text: async () => 'bad session'
    });

    await expectAsync(service.refreshUplinkSessions()).toBeRejectedWithError(
      /Request to \/command-sessions failed \(400\): bad session/
    );
    expect(service.state.error).toContain('400');
  });

  it('reports network failures', async () => {
    fetchSpy.and.rejectWith(new Error('down'));

    await expectAsync(service.refreshUplinkSessions()).toBeRejectedWithError(
      /Request to \/command-sessions failed: down/
    );
    expect(service.state.error).toContain('down');
  });
});
