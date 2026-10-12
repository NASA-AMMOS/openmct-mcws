import ImmediateCommandViewProvider from './ImmediateCommandViewProvider.js';

describe('ImmediateCommandViewProvider', () => {
  it('views only immediateCommand objects', () => {
    const provider = new ImmediateCommandViewProvider({});

    expect(provider.canView({ type: 'vista.immediateCommand' })).toBe(true);
    expect(provider.canView({ type: 'vista.dataset' })).toBe(false);
  });
});
