import VISTAType from './VISTAType.js';

/**
 * Represents a Command Source in a dataset, a node that contains all
 * commands in a specific dataset.
 *
 * Id format: "vista:source:command:<dataset_id>"
 */
const CommandSourceType = new VISTAType({
  key: 'vista.commandSource',
  name: 'Commands',
  cssClass: 'icon-dictionary',
  pattern: /^source:command:([a-zA-Z0-9-:]+)/,
  transform: function (match) {
    return {
      datasetIdentifier: VISTAType.toIdentifier(match[1])
    };
  },
  makeId: function (datasetIdentifier) {
    return 'source:command:' + VISTAType.toKeyString(datasetIdentifier);
  },
  getComposition: function (domainObject, dataset, data, types) {
    if (dataset.hasCommands()) {
      return dataset.commands.getGroups().then((groups) => {
        return groups.map((group) => {
          return types.CommandGroup.makeIdentifier(group.key, data.datasetIdentifier);
        });
      });
    }
    return Promise.resolve([]);
  }
});

export default CommandSourceType;
