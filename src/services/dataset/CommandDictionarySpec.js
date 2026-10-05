import CommandDictionary from './CommandDictionary.js';
import mcws from 'services/mcws/mcws.js';
import sessionServiceDefault from 'services/session/SessionService.js';
import commandDictionaryFixture from '../../../test_data/CommandDictionary.json';

describe('CommandDictionary', () => {
  let commandDictionary;
  let mockDataset;

  beforeEach(() => {
    sessionServiceDefault(
      {
        notifications: jasmine.createSpyObj('notifications', ['info', 'alert', 'progress'])
      },
      {
        sessions: {
          historicalSessionFilter: { disable: true },
          realtimeSession: { disable: true }
        }
      }
    );

    mockDataset = {
      load: () => Promise.resolve(mockDataset),
      getActiveCommandDictionaryUrl: () => '/test/CommandDictionary'
    };

    spyOn(mcws, 'opaqueFile').and.returnValue({
      read: () =>
        Promise.resolve({
          json: () => Promise.resolve(commandDictionaryFixture)
        })
    });

    commandDictionary = new CommandDictionary(mockDataset);
  });

  it('fetches the JSON command dictionary as an opaque file', async () => {
    await commandDictionary.load();

    expect(mcws.opaqueFile).toHaveBeenCalledWith('/test/CommandDictionary');
    expect(commandDictionary.dictionary.id).toBe(commandDictionaryFixture.id);
  });

  it('returns FSW command definitions by stem', async () => {
    const command = await commandDictionary.getCommand('FSW_SET_MODE');

    expect(command.stem).toBe('FSW_SET_MODE');
    expect(command.type).toBe('fsw_command');
    expect(command.arguments.length).toBe(3);
    expect(command.argumentMap.mode.arg_type).toBe('enum');
  });

  it('returns HW command definitions by stem', async () => {
    const command = await commandDictionary.getCommand('HDW_POWER_ON');

    expect(command.stem).toBe('HDW_POWER_ON');
    expect(command.type).toBe('hw_command');
    expect(command.description).toBe('Turns the hardware power on.');
  });

  it('returns a missing placeholder for unknown stems', async () => {
    const command = await commandDictionary.getCommand('NO_SUCH_COMMAND');

    expect(command.stem).toBe('NO_SUCH_COMMAND');
    expect(command.status).toBe('missing');
  });

  it('groups commands into FSW and HW groups', async () => {
    const groups = await commandDictionary.getGroups();

    expect(groups.map((group) => group.key)).toEqual(['fsw', 'hw']);

    const fswStems = await commandDictionary.getGroupCommandStems('fsw');
    expect(fswStems).toEqual(['FSW_CONFIGURE', 'FSW_SET_MODE']);

    const hwStems = await commandDictionary.getGroupCommandStems('hw');
    expect(hwStems).toEqual(['HDW_POWER_OFF', 'HDW_POWER_ON']);
  });

  it('handles an already-parsed dictionary body', async () => {
    mcws.opaqueFile.and.returnValue({
      read: () => Promise.resolve(commandDictionaryFixture)
    });

    const command = await commandDictionary.getCommand('FSW_CONFIGURE');

    expect(command.stem).toBe('FSW_CONFIGURE');
    expect(command.arguments.length).toBe(8);
  });

  it('loads empty when no command dictionary url is configured', async () => {
    mockDataset.getActiveCommandDictionaryUrl = () => undefined;
    commandDictionary = new CommandDictionary(mockDataset);

    const groups = await commandDictionary.getGroups();

    expect(groups).toEqual([]);
    expect(mcws.opaqueFile).not.toHaveBeenCalled();
  });
});
