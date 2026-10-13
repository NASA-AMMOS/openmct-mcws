import CommandType from './CommandType.js';
import types from './types.js';
import CommandDictionary from '../services/dataset/CommandDictionary.js';
import mcws from 'services/mcws/mcws.js';
import sessionServiceDefault from 'services/session/SessionService.js';
import commandDictionaryFixture from '../../test_data/CommandDictionary.json';

const DATASET_IDENTIFIER = {
  namespace: 'vista',
  key: 'test-dataset'
};

describe('CommandType', () => {
  let currentDictionary;

  // NOTE: dataset.load() must resolve the dataset itself; build it
  // once per test so the self reference is stable.
  function buildDataset() {
    const dataset = {
      getActiveCommandDictionaryUrl: () => '/test/CommandDictionary'
    };

    dataset.load = () => Promise.resolve(dataset);

    return dataset;
  }

  beforeEach(() => {
    currentDictionary = commandDictionaryFixture;

    const sessionService = sessionServiceDefault(
      {
        on: jasmine.createSpy('on'),
        notifications: jasmine.createSpyObj('notifications', ['info', 'alert', 'progress'])
      },
      {
        sessions: {
          historicalSessionFilter: { disable: false, maxRecords: 1000 },
          realtimeSession: { disable: false }
        }
      }
    );

    spyOn(sessionService, 'listen').and.returnValue(() => {});
    spyOn(mcws, 'opaqueFile').and.callFake(() => ({
      read: () =>
        Promise.resolve({
          json: () => Promise.resolve(currentDictionary)
        })
    }));
  });

  async function datasetWithCommands() {
    const commands = new CommandDictionary(buildDataset());

    await commands.load();

    return {
      hasCommands: () => true,
      commands
    };
  }

  async function expectStemRoundTrip(dataset, stem) {
    const identifier = CommandType.makeIdentifier(DATASET_IDENTIFIER, stem);

    expect(types.typeForIdentifier(identifier)).toBe(CommandType);

    const data = CommandType.data(identifier);

    expect(data.stem).toBe(stem);
    expect(data.datasetIdentifier).toEqual(DATASET_IDENTIFIER);

    const object = await CommandType.makeObject(dataset, data);

    expect(object.status).toBeUndefined();
    expect(object.name).toBe(stem);
    expect(object.definition.stem).toBe(stem);

    return object;
  }

  it('resolves every test dictionary stem without missing objects', async () => {
    const dataset = await datasetWithCommands();
    const groups = await dataset.commands.getGroups();

    expect(groups.length).toBeGreaterThan(0);

    for (const group of groups) {
      const stems = await dataset.commands.getGroupCommandStems(group.key);

      expect(stems.length).toBeGreaterThan(0);

      for (const stem of stems) {
        await expectStemRoundTrip(dataset, stem);
      }
    }
  });

  it('round-trips dotted stems from real dictionaries', async () => {
    currentDictionary = {
      fswCommands: [
        {
          stem: 'deployment.commanddispatcher.no_op',
          type: 'fsw_command',
          description: 'No-op.',
          arguments: []
        }
      ],
      hwCommands: []
    };

    const dataset = await datasetWithCommands();
    const object = await expectStemRoundTrip(dataset, 'deployment.commanddispatcher.no_op');

    expect(object.definition.description).toBe('No-op.');
  });

  it('marks genuinely unknown stems missing', async () => {
    const dataset = await datasetWithCommands();
    const identifier = CommandType.makeIdentifier(DATASET_IDENTIFIER, 'NO_SUCH_COMMAND');
    const object = await CommandType.makeObject(dataset, CommandType.data(identifier));

    expect(object.status).toBe('missing');
    expect(object.name).toBe('NO_SUCH_COMMAND - MISSING COMMAND');
  });
});
