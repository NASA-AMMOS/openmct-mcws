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

// Helper function to replace lodash groupBy
function groupBy(array, key) {
  return array.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
}

// Helper function to replace lodash map
function map(array, key) {
  return array.map((item) => (typeof key === 'function' ? key(item) : item[key]));
}

// Helper function to replace lodash values
function values(obj) {
  return Object.values(obj);
}

// TODO: implement basic ChannelDictionary object which takes 1-2 URLS and returns
class ChannelDictionary {
  constructor(dataset) {
    this.dataset = dataset;
    this.sessions = sessionServiceDefault();
    this.channelsById = {};
    this.groupsByKey = {};
    this.groups = [];
    this.loaded = false;

    this.sessions.listen(this.loadOnSessionChange);
  }

  /**
   * Gets a channel definition
   *
   * @public
   */
  getChannel(id) {
    return this.load().then(() => {
      if (!this.channelsById[id]) {
        return {
          channel_id: id,
          channel_name: 'MISSING CHANNEL',
          status: 'missing'
        };
      }
      return this.channelsById[id];
    });
  }

  /**
   * Gets all groups of channels.
   *
   * @public
   */
  getGroups() {
    return this.load().then(() => {
      return this.groups;
    });
  }

  /**
   * Gets a specific group of channels, by key.
   *
   * @public
   */
  getGroup(key) {
    return this.load().then(() => {
      return this.groupsByKey[key];
    });
  }

  /**
   * Gets channel ids in a specific group.
   *
   * @public
   */
  getGroupChannelIds(key) {
    return this.getGroup(key).then((group) => {
      return group.channelIds;
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
        .then(() => this.fetchDictionaries())
        .then((results) => this.combineDictionaries(results))
        .then((channelDictionary) => this.groupChannels(channelDictionary))
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
  standardizeDictionary(channelDictionary) {
    if (channelDictionary[0]?.['channel-Mnemonic']) {
      channelDictionary = channelDictionary.map((row) => {
        return {
          channel_id: row['channel-ID'],
          channel_name: row['channel-Mnemonic'],
          data_type: row['channel-Type'],
          dn_to_eu: row['DN2EU-flag'],
          dn_units: row['DN-units'],
          eu_units: row['EU-units']
        };
      });
    }

    return sortBy(channelDictionary, 'channel_id');
  }

  /**
   * @private
   */
  combineDictionaries(results) {
    const channelDictionary = results[0];
    const enumerationDictionary = results[1];

    this.channelsById = keyBy(channelDictionary, 'channel_id');

    enumerationDictionary.forEach((chanEnumDef) => {
      const id = chanEnumDef.channel_id;

      if (!this.channelsById[id]) {
        return;
      }

      if (!this.channelsById[id].enumerations) {
        this.channelsById[id].enumerations = [];
      }
      this.channelsById[id].enumerations.push(chanEnumDef);
    });

    return channelDictionary;
  }

  /**
   * @private
   */
  fetchDictionaries() {
    const fetching = [];
    const channelDictionaryUrl = this.dataset.getActiveChannelDictionaryUrl();
    const channelEnumerationDictionaryUrl = this.dataset.getActiveChannelEnumerationDictionaryUrl();

    if (channelDictionaryUrl) {
      fetching.push(this.getDataTable(channelDictionaryUrl).then((data) => this.standardizeDictionary(data)));
    } else {
      fetching.push(Promise.resolve([]));
    }
    if (channelEnumerationDictionaryUrl) {
      fetching.push(this.getDataTable(channelEnumerationDictionaryUrl));
    } else {
      fetching.push(Promise.resolve([]));
    }

    return Promise.all(fetching);
  }

  /**
   * @private
   */
  groupChannels(channels) {
    const byPrefix = groupBy(channels, (channel) => {
      return channel.channel_id.split('-')[0];
    });

    Object.entries(byPrefix).forEach(([prefix, channels]) => {
      this.groupsByKey[prefix] = {
        name: prefix,
        key: prefix,
        channels: channels,
        channelIds: map(channels, 'channel_id')
      };
    });
    this.groups = sortBy(values(this.groupsByKey), 'name');
  }

  /**
   * @private
   */
  getDataTable(url) {
    return mcws.dataTable(url).read();
  }
}

export default ChannelDictionary;
