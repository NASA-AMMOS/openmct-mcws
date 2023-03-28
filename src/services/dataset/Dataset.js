define([
    './ChannelDictionary',
    './EVRDictionary',
    'services/mcws/mcws',
    'services/session/SessionService',
    '../../constants',
    'lodash',
], function (
    ChannelDictionary,
    EVRDictionary,
    mcwsDefault,
    sessionServiceDefault,
    constants,
    _,
) {
    const mcws = mcwsDefault.default;
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
    function Dataset(domainObject) {
        this.identifier = domainObject.identifier;
        this.options = this.castStreamUrlProtocols(domainObject);

        if (this.hasChannels()) {
            this.channels = new ChannelDictionary(this);
            this.channels.urls = _.pick(this.options, constants.CHANNEL_COPY_KEYS);
            this.channelAlarms = {
                urls: _.pick(this.options, constants.CHANNEL_COPY_KEYS)
            };
        }

        if (this.hasHeaderChannels()) {
            this.headerChannels = {
                urls: _.pick(this.options, constants.CHANNEL_COPY_KEYS),
                headerChannelsString: this.options.headerChannels
            };
        }

        if (this.hasEVRs()) {
            this.evrs = new EVRDictionary(this);
            this.evrs.urls = _.pick(this.options, constants.EVR_PROPERTIES);
        }
        if (this.hasDictionaries()) {
            this.dictionaries = {
                urls: _.pick(this.options, constants.DICTIONARY_PROPERTIES)
            };
        }
        if (this.hasDataProducts()) {
            this.dataProducts = {
                urls: _.pick(this.options, constants.DATA_PRODUCT_PROPERTIES)
            };
        }
        if (this.hasPackets()) {
            this.packets = {
                urls: _.pick(this.options, constants.PACKET_PROPERTIES)
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
            }
        }
        if (this.hasFrameEvent()) {
            this.frameEvent = {
                frameEventStreamUrl: this.options.frameEventStreamUrl
            }
        }
        if (this.hasAlarmMessage()) {
            this.alarmMessageStream = {
                alarmMessageStreamUrl: this.options.alarmMessageStreamUrl
            }
        }
    }

    /**
     * Returns true if the dataset contains channels.
     *
     * @private
     */
    Dataset.prototype.hasChannels = function () {
        return _.some(_.values(_.pick(this.options, constants.CHANNEL_PROPERTIES)));
    };


    /**
     * Returns true if the dataset contains EVRs.
     *
     * @private
     */
    Dataset.prototype.hasEVRs = function () {
        return _.some(_.values(_.pick(this.options, constants.EVR_PROPERTIES)));
    };


    /**
     * Returns true if the dataset contains dictionaries.
     *
     * @private
     */
    Dataset.prototype.hasDictionaries = function () {
        return _.some(_.values(_.pick(this.options, constants.DICTIONARY_PROPERTIES)));
    };


    /**
     * Returns true if the dataset contains data products.
     *
     * @private
     */
    Dataset.prototype.hasDataProducts = function () {
        return _.every(constants.DATA_PRODUCT_PROPERTIES, _.partial(_.has, this.options));
    };

    /**
     * Returns true if the dataset contains packets.
     *
     * @private
     */
    Dataset.prototype.hasPackets = function () {
        return _.every(constants.PACKET_PROPERTIES, _.partial(_.has, this.options));
    };

    Dataset.prototype.hasMessages = function () {
        return !!(this.options.messageStreamUrl || this.options.messageHistoricalUrl);
    };

    Dataset.prototype.hasFrameSummary = function () {
        return !!(this.options.frameSummaryStreamUrl || this.options.frameSummaryStreamUrl);
    };

    Dataset.prototype.hasFrameEvent = function () {
        return this.options.frameEventStreamUrl;
    };

    Dataset.prototype.hasAlarmMessage = function () {
        return this.options.alarmMessageStreamUrl;
    };

    Dataset.prototype.hasHeaderChannels = function () {
        return !!(this.options.headerChannels && this.options.channelStreamUrl);
    };

    Dataset.prototype.getActiveChannelDictionaryUrl = function () {
        return this.options.channelDictionaryUrl && 
            this.getActiveDictionaryUrl(this.options.channelDictionaryUrl);
    };

    Dataset.prototype.getActiveChannelEnumerationDictionaryUrl = function () {
        return this.options.channelEnumerationDictionaryUrl && 
            this.getActiveDictionaryUrl(this.options.channelEnumerationDictionaryUrl);
    };

    Dataset.prototype.getActiveEvrDictionaryUrl = function () {
        return this.options.eventRecordDictionaryUrl && 
            this.getActiveDictionaryUrl(this.options.eventRecordDictionaryUrl);
    };

    Dataset.prototype.getActiveDictionaryUrl = function (url) {
        const sessions = sessionServiceDefault.default();
        let activeTopicOrSession = sessions.getActiveTopicOrSession();
        if (activeTopicOrSession && 
            activeTopicOrSession.fsw_version && 
            this.omitsDictionaryVersion(url)) {
                if (url.endsWith('/')){
                    return url + activeTopicOrSession.fsw_version;
                } else {
                    return url + '/' + activeTopicOrSession.fsw_version;
                }
            }
        return url;
    };

    Dataset.prototype.omitsDictionaryVersion = function (url) {
        return /\/.*Dictionary\/?$/.test(url);
    };

    /**
     * Returns the urlType
     * eg 
     * protocol-relative: //{SERVER}/channels
     * host-relative: /channels
     * fully-qualified: wss://{SERVER}/channels
     *
     * @private
     */
    Dataset.prototype.urlType = function (url) {
        if (url.startsWith('/')) {
            if(url.startsWith('//')) {
                return 'protocol-relative';
            } else {
                return 'host-relative';
            }
        } else if (/(ws|wss):/.test(url)) {
            return 'fully-qualified';
        }
    };

    /**
     * Returns an options object with 
     * fully qualified stream(websocket) urls
     * 
     * @private
     */
    Dataset.prototype.castStreamUrlProtocols = function (options) {
        let streamKeys = constants.WEBSOCKET_STREAM_URL_KEYS,
            protocol = window.location.protocol,
            host = window.location.host;

        streamKeys.forEach(streamKey => {
            let url = options[streamKey];

            if (url) {
                let urlType = this.urlType(url);

                if (urlType === 'protocol-relative') {
                    if (protocol === 'https:') {
                        options[streamKey] = 'wss:' + url;
                    } else {
                        options[streamKey] = 'ws:' + url;
                    }
                } else if (urlType === 'host-relative') {
                    if (protocol === "https:") {
                        options[streamKey] = "wss://" + host + '/' + url;
                    } else {
                        options[streamKey] = "ws://" + host + '/' + url;
                    }
                }
            }
        });

        return options;
    };

    Dataset.prototype.load = function () {
        if (this.loading) {
            return this.loading;
        }
        if (this.loaded) {
            return Promise.resolve(this);
        }
        if (this.options.mcwsRootUrl) {
            return this.loading = mcws.namespace(this.options.mcwsRootUrl)
                .getMetadata()
                .then(function (m) {
                    this.version = Number(m.get('mcws', 'has_version').slice(0,3));
                    delete this.loading;
                    this.loaded = true;
                    return this;
                }.bind(this), function () {
                    this.version = 3.0; // minimum supported version
                    this.loaded = true;
                    delete this.loading;
                    return this;
                }.bind(this));
        }
        this.version = 3.0; // minimum supported version
        this.loaded = true;
        return Promise.resolve(this);
    };

    return Dataset;
});
