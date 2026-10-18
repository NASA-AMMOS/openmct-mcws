import MCWSStreamProvider from './MCWSStreamProvider.js';

function providerWith(subscriptions, updates) {
  const provider = Object.create(MCWSStreamProvider.prototype);

  provider.subscriptions = subscriptions;
  provider.vistaTime = () => ({
    update: (datum) => updates.push(datum)
  });
  provider.openmct = {
    notifications: {
      error: () => {}
    }
  };

  return provider;
}

describe('MCWSStreamProvider onmessage', () => {
  it('ticks the clock once per message, not once per subscription', () => {
    const updates = [];
    const seen = [];
    const provider = providerWith(
      {
        url: {
          key: [
            { callback: (datum) => seen.push(datum) },
            { callback: (datum) => seen.push(datum) }
          ]
        }
      },
      updates
    );

    provider.onmessage({ data: { url: 'url', key: 'key', values: [{ ert: 1 }, { ert: 2 }] } });

    expect(updates.length).toBe(1);
    expect(updates[0]).toEqual({ ert: 1 });
    expect(seen.length).toBe(4);
  });

  it('ignores messages without subscriptions', () => {
    const updates = [];
    const provider = providerWith({}, updates);

    provider.onmessage({ data: { url: 'url', key: 'key', values: [{ ert: 1 }] } });

    expect(updates.length).toBe(1);
  });

  it('reports a lost connection on worker onclose without values', () => {
    const updates = [];
    const errors = [];
    const provider = providerWith({}, updates);
    provider.openmct.notifications.error = (message) => errors.push(message);
    spyOn(console, 'error');

    expect(() => {
      provider.onmessage({ data: { onclose: true, code: 1006, reason: 'abnormal closure' } });
    }).not.toThrow();

    expect(updates.length).toBe(0);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain('connection lost');
  });

  it('reports worker onerror without values', () => {
    const updates = [];
    const errors = [];
    const provider = providerWith({}, updates);
    provider.openmct.notifications.error = (message) => errors.push(message);
    spyOn(console, 'error');

    expect(() => {
      provider.onmessage({
        data: {
          onerror: true,
          url: 'ws://localhost:8090/mcws-test',
          query: 'filter=(session_id=1)',
          code: 'unavailable',
          reason: 'WebSocket error occurred'
        }
      });
    }).not.toThrow();

    expect(updates.length).toBe(0);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain('Websocket Error');
  });

  it('ignores onclose codes other than 1006 without throwing', () => {
    const updates = [];
    const errors = [];
    const provider = providerWith({}, updates);
    provider.openmct.notifications.error = (message) => errors.push(message);
    spyOn(console, 'error');

    expect(() => {
      provider.onmessage({ data: { onclose: true, code: 1000, reason: 'normal closure' } });
    }).not.toThrow();

    expect(updates.length).toBe(0);
    expect(errors.length).toBe(0);
  });
});
