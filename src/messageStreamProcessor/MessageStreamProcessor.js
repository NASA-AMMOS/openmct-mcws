import ChannelType from '../types/ChannelType.js';
import DatasetCache from 'services/dataset/DatasetCache.js';

/**
 * MessageStreamProcessor accepts a url and supportedMessages to subscribe to a message stream and listen for
 * supported messages (StartOfSession, EndOfSession) to clear out data on screen.
 * @param {string} url URL for the messages stream end point
 * @param {Object} supportedMessages string messages_type that will trigger clear data and suspect channel message
 * @param {Object} openmct
 */
class MessageStreamProcessor {
  constructor(url, supportedMessages, openmct) {
    this.url = url;
    this.openmct = openmct;
    this.supportedMessages = supportedMessages;
    this.filters = this.buildFiltersArray(supportedMessages);
    this.markedSuspectChannels = {};
    this.notificationService = openmct.notifications;
    this.options = {
      filters: {
        message_type: {
          equals: this.filters
        }
      }
    };

    //mock domainObject to use MCWSMessageStreamProvider
    this.domainObject = {
      identifier: {
        key: 'message::clear-data-static-object',
        namespace: 'vista'
      },
      telemetry: {
        ignoreDomains: true,
        messageStreamUrl: url,
        mcwsVersion: 3,
        values: [],
        key: 'message',
        property: 'record_type'
      }
    };

    this.processData = this.processData.bind(this);
    this.processSuspectChannels = this.processSuspectChannels.bind(this);
    this.buildSuspectKeyStrings = this.buildSuspectKeyStrings.bind(this);
    this.findDatasetsWithChannels = this.findDatasetsWithChannels.bind(this);
    this.clearData = this.clearData.bind(this);
    this.subscribe = this.subscribe.bind(this);
  }

  processData(message) {
    if (!message.message_type) {
      return;
    }

    if (
      this.supportedMessages.clearData &&
      this.supportedMessages.clearData.includes(message.message_type)
    ) {
      this.clearData(message);
    } else if (
      this.supportedMessages.suspectChannels &&
      this.supportedMessages.suspectChannels.includes(message.message_type)
    ) {
      this.processSuspectChannels(message);
    }
  }

  /**
   *
   * @param {Object} message - message from messageStream
   *
   * Processes message with suspectChannels and marks the status 'suspect' for channels that are suspect
   */
  processSuspectChannels(message) {
    let currentSuspectChannelsObject = message.suspect_channels[0];
    let currentSuspectChannelsArray = Object.keys(currentSuspectChannelsObject);
    let datasetIdentifiers = this.findDatasetsWithChannels();

    if (datasetIdentifiers.length && currentSuspectChannelsArray.length) {
      currentSuspectChannelsArray.forEach((suspectChannel) => {
        if (!this.markedSuspectChannels[suspectChannel]) {
          let suspectKeyStrings = this.buildSuspectKeyStrings(suspectChannel, datasetIdentifiers);

          suspectKeyStrings.forEach((suspectKeyString) => {
            this.openmct.status.set(suspectKeyString, 'suspect');
          });

          this.markedSuspectChannels[suspectChannel] = suspectKeyStrings;

          this.notificationService.alert(`Following Channel marked as suspect - ${suspectChannel}`);
        }
      });
    } else {
      console.warn(`Datasets not found with Channels - ${currentSuspectChannelsArray.join(',')}`);
    }

    Object.keys(this.markedSuspectChannels).forEach((markedSuspectChannel) => {
      if (!currentSuspectChannelsObject[markedSuspectChannel]) {
        this.openmct.status.delete(markedSuspectChannel);

        this.markedSuspectChannels[markedSuspectChannel] = undefined;
        delete this.markedSuspectChannels[markedSuspectChannel];

        this.notificationService.alert(
          `Following Channel is not marked as suspect anymore - ${markedSuspectChannel}`
        );
      }
    });
  }

  /**
   *
   * @param {String} suspectChannel  - Name of suspect channel
   * @param {Array} datasetsIdentifiers  - Array of dataset identifiers
   *
   * @returns {Array} of suspect channel keyStrings
   */
  buildSuspectKeyStrings(suspectChannel, datasetsIdentifiers) {
    let suspectKeyStrings = [];

    datasetsIdentifiers.forEach((dataset) => {
      suspectKeyStrings.push('vista:' + ChannelType.makeId(dataset, suspectChannel));
    });

    return suspectKeyStrings;
  }

  /**
   * returns datasets that have channels
   */
  findDatasetsWithChannels() {
    const datasetCache = DatasetCache();
    const datasets = datasetCache.datasets;
    const datasetsWithChannels = [];

    for (const key in datasets) {
      const dataset = datasets[key];

      if (dataset.hasChannels()) {
        datasetsWithChannels.push(dataset.identifier);
      }
    }

    return datasetsWithChannels;
  }

  /**
   * emits clearData message
   */
  clearData(message) {
    this.openmct.objectViews.emit('clearData');
    this.notificationService.info(
      `Data Cleared On All Displays By ${message.message_type} Message`
    );
  }

  /**
   * Builds an array of all supported message_types
   */
  buildFiltersArray(supportedMessages) {
    let filtersArray = [];

    Object.keys(supportedMessages).forEach((key) => {
      supportedMessages[key].forEach((messageType) => {
        filtersArray.push(messageType);
      });
    });

    return filtersArray;
  }

  /**
   * @returns an unsubscribe function
   */
  subscribe() {
    return this.openmct.telemetry.subscribe(this.domainObject, this.processData, this.options);
  }
}

export default MessageStreamProcessor;
