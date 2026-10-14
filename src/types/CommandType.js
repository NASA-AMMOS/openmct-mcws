import VISTAType from './VISTAType.js';
import CommandGroupType from './CommandGroupType.js';

/**
 * Represents a Command in a specific dataset; e.g. FSW_SET_MODE.
 *
 * Commands have no telemetry provider; the command definition from the
 * JSON command dictionary is attached for command-specific views.
 *
 * Id format: "vista:command:<dataset_id>:<command_stem>". Stems may
 * contain dots (e.g. deployment.commanddispatcher.no_op), so the stem
 * is the full remainder after the dataset key string.
 */
const CommandType = new VISTAType({
  key: 'vista.command',
  name: 'Command',
  cssClass: 'icon-command',
  pattern: /^command:([^:]+:[^:]+):(.+)$/,
  transform: function (match) {
    return {
      datasetIdentifier: VISTAType.toIdentifier(match[1]),
      stem: match[2]
    };
  },
  makeId: function (datasetIdentifier, stem) {
    return 'command:' + VISTAType.toKeyString(datasetIdentifier) + ':' + stem;
  },
  getLocation: function (dataset, data) {
    // FIXME: this works solely because the dataset must have loaded for
    // the CommandType to load.
    const command = dataset.commands.commandsByStem[data.stem];
    const groupKey = command && command.type === 'hw_command' ? 'hw' : 'fsw';

    return CommandGroupType.makeIdentifier(groupKey, data.datasetIdentifier);
  },
  makeObject: function (dataset, data) {
    if (dataset.hasCommands()) {
      return dataset.commands.getCommand(data.stem).then((command) => {
        const object = {
          type: this.key,
          name: data.stem,
          definition: command,
          location: this.getLocation(dataset, data)
        };

        if (command.status === 'missing') {
          object.name = data.stem + ' - MISSING COMMAND';
          object.status = 'missing';
        }

        return object;
      });
    }

    return Promise.resolve({
      type: this.key,
      name: data.stem + ' - MISSING COMMAND',
      status: 'missing'
    });
  }
});

export default CommandType;
