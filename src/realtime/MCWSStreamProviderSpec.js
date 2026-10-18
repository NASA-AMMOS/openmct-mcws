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
          key: [{ callback: (datum) => seen.push(datum) }, { callback: (datum) => seen.push(datum) }]
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
});
