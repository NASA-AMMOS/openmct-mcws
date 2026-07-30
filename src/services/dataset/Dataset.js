import ChannelDictionary from './ChannelDictionary.js';
import EVRDictionary from './EVRDictionary.js';
import mcws from 'services/mcws/mcws.js';
import SessionService from 'services/session/SessionService.js';
import constants from '../../constants.js';

/**
 * Takes a dataset object, and provides getters for all the objects
 * that it contains.
 *
 * @property [channels] the dataset's channel dictionary, if it exists.
 * @property [channelAlarms] the dataset's channelAlarm url, if they exist.
 * @property [evrs] the dataset's evr dictionary, if it exists.
 * @property [dictionaries] the dataset's dictionary urls, if they exist.
 * @property [dataProducts] the dataset's dataProduct urls, if they exist.
 * @property [packets] the dataset's packet urls, if they exist.
 */
class Dataset {
  constructor(domainObject) {
    this.identifier = domainObject.identifier;
    this.options = this.castStreamUrlProtocols(domainObject);

    if (this.hasChannels()) {
      this.channels = new ChannelDictionary(this);
      this.channels.urls = this.pick(this.options, constants.CHANNEL_COPY_KEYS);
      this.channelAlarms = {
        urls: this.pick(this.options, constants.CHANNEL_COPY_KEYS)
      };
    }

    if (this.hasHeaderChannels()) {
      this.headerChannels = {
        urls: this.pick(this.options, constants.CHANNEL_COPY_KEYS),
        headerChannelsString: this.options.headerChannels
      };
    }

    if (this.hasEVRs()) {
      this.evrs = new EVRDictionary(this);
      this.evrs.urls = this.pick(this.options, constants.EVR_PROPERTIES);
    }
    if (this.hasDictionaries()) {
      this.dictionaries = {
        urls: this.pick(this.options, constants.DICTIONARY_PROPERTIES)
      };
    }
    if (this.hasDataProducts()) {
      this.dataProducts = {
        urls: this.pick(this.options, constants.DATA_PRODUCT_PROPERTIES)
      };
    }
    if (this.hasPackets()) {
      this.packets = {
        urls: this.pick(this.options, constants.PACKET_PROPERTIES)
      };
    }
    if (this.hasMessages()) {
      this.messages = {
        messageStreamUrl: this.options.messageStreamUrl
      };
    }
    if (this.hasFrameSummary()) {
      this.frameSummary = {
        frameSummaryStreamUrl: this.options.frameSummaryStreamUrl
      };
    }
    if (this.hasFrameEvent()) {
      this.frameEvent = {
        frameEventStreamUrl: this.options.frameEventStreamUrl
      };
    }
    if (this.hasAlarmMessage()) {
      this.alarmMessageStream = {
        alarmMessageStreamUrl: this.options.alarmMessageStreamUrl
      };
    }
  }

  /**
   * Helper method to replace lodash pick
   */
  pick(obj, keys) {
    const result = {};
    keys.forEach((key) => {
      if (obj.hasOwnProperty(key)) {
        result[key] = obj[key];
      }
    });
    return result;
  }

  /**
   * Helper method to replace lodash values
   */
  values(obj) {
    return Object.values(obj);
  }

  /**
   * Helper method to replace lodash some
   */
  some(array) {
    return array.some((value) => Boolean(value));
  }

  /**
   * Helper method to replace lodash every
   */
  every(keys, hasFunc) {
    return keys.every((key) => hasFunc(key));
  }

  /**
   * Helper method to replace lodash has
   */
  has(obj, key) {
    return obj.hasOwnProperty(key);
  }

  /**
   * Helper method to replace lodash partial
   */
  partial(func, ...args) {
    return function (...remainingArgs) {
      return func(...args, ...remainingArgs);
    };
  }

  /**
   * Returns true if the dataset contains channels.
   *
   * @private
   */
  hasChannels() {
    return this.some(this.values(this.pick(this.options, constants.CHANNEL_PROPERTIES)));
  }

  /**
   * Returns true if the dataset contains EVRs.
   *
   * @private
   */
  hasEVRs() {
    return this.some(this.values(this.pick(this.options, constants.EVR_PROPERTIES)));
  }

  /**
   * Returns true if the dataset contains dictionaries.
   *
   * @private
   */
  hasDictionaries() {
    return this.some(this.values(this.pick(this.options, constants.DICTIONARY_PROPERTIES)));
  }

  /**
   * Returns true if the dataset contains data products.
   *
   * @private
   */
  hasDataProducts() {
    return constants.DATA_PRODUCT_PROPERTIES.every((key) => this.has(this.options, key));
  }

  /**
   * Returns true if the dataset contains packets.
   *
   * @private
   */
  hasPackets() {
    return constants.PACKET_PROPERTIES.every((key) => this.has(this.options, key));
  }

  hasMessages() {
    return !!(this.options.messageStreamUrl || this.options.messageHistoricalUrl);
  }

  hasFrameSummary() {
    return !!(this.options.frameSummaryStreamUrl || this.options.frameSummaryStreamUrl);
  }

  hasFrameEvent() {
    return this.options.frameEventStreamUrl;
  }

  hasAlarmMessage() {
    return this.options.alarmMessageStreamUrl;
  }

  hasHeaderChannels() {
    return !!(this.options.headerChannels && this.options.channelStreamUrl);
  }

  getActiveChannelDictionaryUrl() {
    return (
      this.options.channelDictionaryUrl &&
      this.getActiveDictionaryUrl(this.options.channelDictionaryUrl)
    );
  }

  getActiveChannelEnumerationDictionaryUrl() {
    return (
      this.options.channelEnumerationDictionaryUrl &&
      this.getActiveDictionaryUrl(this.options.channelEnumerationDictionaryUrl)
    );
  }

  getActiveEvrDictionaryUrl() {
    return (
      this.options.eventRecordDictionaryUrl &&
      this.getActiveDictionaryUrl(this.options.eventRecordDictionaryUrl)
    );
  }

  getActiveDictionaryUrl(url) {
    const sessions = new SessionService();
    let activeTopicOrSession = sessions.getActiveTopicOrSession();
    if (
      activeTopicOrSession &&
      activeTopicOrSession.fsw_version &&
      this.omitsDictionaryVersion(url)
    ) {
      if (url.endsWith('/')) {
        return url + activeTopicOrSession.fsw_version;
      } else {
        return url + '/' + activeTopicOrSession.fsw_version;
      }
    }
    return url;
  }

  omitsDictionaryVersion(url) {
    return /\/.*Dictionary\/?$/.test(url);
  }

  /**
   * Returns the urlType
   * eg
   * protocol-relative: //{SERVER}/channels
   * host-relative: /channels
   * fully-qualified: wss://{SERVER}/channels
   *
   * @private
   */
  urlType(url) {
    if (url.startsWith('/')) {
      if (url.startsWith('//')) {
        return 'protocol-relative';
      } else {
        return 'host-relative';
      }
    } else if (/(ws|wss):/.test(url)) {
      return 'fully-qualified';
    }
  }

  /**
   * Returns an options object with
   * fully qualified stream(websocket) urls
   *
   * @private
   */
  castStreamUrlProtocols(options) {
    const streamKeys = constants.WEBSOCKET_STREAM_URL_KEYS;
    const protocol = window.location.protocol;
    const host = window.location.host;

    streamKeys.forEach((streamKey) => {
      const url = options[streamKey];

      if (url) {
        const urlType = this.urlType(url);

        if (urlType === 'protocol-relative') {
          if (protocol === 'https:') {
            options[streamKey] = 'wss:' + url;
          } else {
            options[streamKey] = 'ws:' + url;
          }
        } else if (urlType === 'host-relative') {
          if (protocol === 'https:') {
            options[streamKey] = 'wss://' + host + '/' + url;
          } else {
            options[streamKey] = 'ws://' + host + '/' + url;
          }
        }
      }
    });

    return options;
  }

  load() {
    if (this.loading) {
      return this.loading;
    }
    if (this.loaded) {
      return Promise.resolve(this);
    }
    if (this.options.mcwsRootUrl) {
      return (this.loading = mcws
        .namespace(this.options.mcwsRootUrl)
        .getMetadata()
        .then(
          (m) => {
            this.version = Number(m.get('mcws', 'has_version').slice(0, 3));
            delete this.loading;
            this.loaded = true;
            return this;
          },
          () => {
            this.version = 3.0; // minimum supported version
            this.loaded = true;
            delete this.loading;
            return this;
          }
        ));
    }
    this.version = 3.0; // minimum supported version
    this.loaded = true;
    return Promise.resolve(this);
  }
}

export default Dataset;
