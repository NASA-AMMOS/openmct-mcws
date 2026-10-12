import SessionControlViewProvider from './SessionControlViewProvider.js';

describe('SessionControlViewProvider', () => {
  it('views only sessionControl objects', () => {
    const provider = new SessionControlViewProvider({});

    expect(provider.canView({ type: 'vista.sessionControl' })).toBe(true);
    expect(provider.canView({ type: 'vista.dataset' })).toBe(false);
  });
});
