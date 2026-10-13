import CommandDetailViewProvider from './CommandDetailViewProvider.js';

describe('CommandDetailViewProvider', () => {
  const provider = new CommandDetailViewProvider({});

  it('views vista.command objects', () => {
    expect(provider.canView({ type: 'vista.command' })).toBe(true);
  });

  it('ignores other object types', () => {
    expect(provider.canView({ type: 'vista.channel' })).toBe(false);
    expect(provider.canView({ type: 'vista.commandGroup' })).toBe(false);
  });
});
