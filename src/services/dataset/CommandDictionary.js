import mcws from 'services/mcws/mcws.js';
import sessionServiceDefault from 'services/session/SessionService.js';

// Helper function to replace lodash sortBy
function sortBy(array, key) {
  return [...array].sort((a, b) => {
    const aVal = typeof key === 'function' ? key(a) : a[key];
    const bVal = typeof key === 'function' ? key(b) : b[key];
    if (aVal < bVal) return -1;
    if (aVal > bVal) return 1;
    return 0;
  });
}

// Helper function to replace lodash keyBy
function keyBy(array, key) {
  return array.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key];
    result[groupKey] = item;
    return result;
  }, {});
}

const COMMAND_GROUPS = [
  {
    key: 'fsw',
    name: 'FSW Commands',
    type: 'fsw_command'
  },
  {
    key: 'hw',
    name: 'HW Commands',
    type: 'hw_command'
  }
];

/**
 * Command dictionary backed by JSON in the plandev-ampcs format
 * (converted from an AMPCS XML command dictionary).
 * Unlike channel and EVR dictionaries, this is an opaque JSON file,
 * not a datatable.
 */
class CommandDictionary {
  constructor(dataset) {
    this.dataset = dataset;
    this.sessions = sessionServiceDefault();
    this.commandsByStem = {};
    this.groupsByKey = {};
    this.groups = [];
    this.dictionary = null;
    this.loaded = false;

    this.sessions.listen(this.loadOnSessionChange);
  }

  /**
   * Gets a command definition by stem.
   *
   * @public
   */
  getCommand(stem) {
    return this.load().then(() => {
      if (!this.commandsByStem[stem]) {
        return {
          stem: stem,
          description: 'MISSING COMMAND',
          status: 'missing'
        };
      }
      return this.commandsByStem[stem];
    });
  }

  /**
   * Gets all non-empty command groups (FSW/HW).
   *
   * @public
   */
  getGroups() {
    return this.load().then(() => {
      return this.groups;
    });
  }

  /**
   * Gets a specific group of commands, by key.
   *
   * @public
   */
  getGroup(key) {
    return this.load().then(() => {
      return this.groupsByKey[key];
    });
  }

  /**
   * Gets command stems in a specific group.
   *
   * @public
   */
  getGroupCommandStems(key) {
    return this.getGroup(key).then((group) => {
      return group ? group.commandStems : [];
    });
  }

  /**
   * @private
   */
  load() {
    if (this.loaded) {
      return Promise.resolve();
    }
    if (!this.loading) {
      this.loading = this.dataset
        .load()
        .then(() => this.fetchDictionary())
        .then((dictionary) => this.normalizeDictionary(dictionary))
        .then((commands) => this.groupCommands(commands))
        .then(() => {
          this.loaded = true;
        });
    }
    return this.loading;
  }

  /**
   * @private
   */
  loadOnSessionChange = (session) => {
    if (session) {
      this.loaded = false;
      this.loading = false;
      this.load();
    }
  };

  /**
   * @private
   */
  normalizeDictionary(dictionary) {
    this.dictionary = dictionary || {};
    const fswCommands = this.dictionary.fswCommands || [];
    const hwCommands = this.dictionary.hwCommands || [];
    const commands = sortBy(fswCommands.concat(hwCommands), 'stem');

    this.commandsByStem = keyBy(commands, 'stem');

    return commands;
  }

  /**
   * @private
   */
  fetchDictionary() {
    const commandDictionaryUrl = this.dataset.getActiveCommandDictionaryUrl();

    if (!commandDictionaryUrl) {
      return Promise.resolve({});
    }

    return this.getDataFile(commandDictionaryUrl);
  }

  /**
   * @private
   */
  groupCommands(commands) {
    const byType = keyBy(COMMAND_GROUPS, 'type');
    Object.values(byType).forEach((group) => {
      const groupCommands = commands.filter((command) => command.type === group.type);

      if (groupCommands.length) {
        this.groupsByKey[group.key] = {
          name: group.name,
          key: group.key,
          type: group.type,
          commands: groupCommands,
          commandStems: groupCommands.map((command) => command.stem)
        };
      }
    });
    this.groups = sortBy(Object.values(this.groupsByKey), 'name');
  }

  /**
   * Reads an opaque JSON file, handling both raw fetch Responses
   * and already-parsed bodies.
   *
   * @private
   */
  getDataFile(url) {
    return mcws
      .opaqueFile(url)
      .read()
      .then((response) => {
        if (response && typeof response.json === 'function') {
          return response.json();
        }
        return response;
      });
  }
}

export default CommandDictionary;
