import VISTAType from './VISTAType.js';
import CommandSourceType from './CommandSourceType.js';

/**
 * Represents a Command Group Node (FSW or HW commands).
 *
 * Id format: "vista:node:command:<group_id>:<dataset_id>"
 */
const CommandGroupType = new VISTAType({
  key: 'vista.commandGroup',
  name: 'Command Group',
  cssClass: 'icon-dictionary',
  pattern: /^node:command:([a-zA-Z0-9/_-]+):([a-zA-Z0-9-:]+)/,
  transform: function (match) {
    return {
      name: match[1],
      datasetIdentifier: VISTAType.toIdentifier(match[2])
    };
  },
  makeId: function (name, datasetIdentifier) {
    return ['node', 'command', name, VISTAType.toKeyString(datasetIdentifier)].join(':');
  },
  getLocation: function (dataset, data) {
    return CommandSourceType.makeIdentifier(data.datasetIdentifier);
  },
  getComposition: function (domainObject, dataset, data, types) {
    if (dataset.hasCommands()) {
      return dataset.commands.getGroupCommandStems(data.name).then((commandStems) => {
        return commandStems.map((stem) => {
          return types.Command.makeIdentifier(data.datasetIdentifier, stem);
        });
      });
    }
    return Promise.resolve([]);
  }
});

export default CommandGroupType;
