define([
    'services/mcws/mcws',
    'services/session/SessionService',
    'lodash',
    'openmct'
], function (
    mcwsDefault,
    sessionServiceDefault,
    _,
    openmct
) {
    // TODO: implement basic ChannelDictionary object which takes 1-2 URLS and returns
    const mcws = mcwsDefault.default;

    function ChannelDictionary(dataset) {
        this.dataset = dataset;
        this.sessions = sessionServiceDefault.default();
        this.channelsById = {};
        this.groupsByKey = {};
        this.groups = [];
        this.loaded = false;
        [
            'combineDictionaries',
            'groupChannels',
            'standardizeDictionary',
            'fetchDictionaries',
            'loadOnSessionChange'
        ].forEach(function (method) {
            this[method] = this[method].bind(this);
        }, this);

        this.sessions.listen(this.loadOnSessionChange);
    }

    /**
     * Gets a channel definition
     *
     * @public
     */
    ChannelDictionary.prototype.getChannel = function (id) {
        return this.load()
            .then(function () {
                if (!this.channelsById[id]) {
                    return {
                        channel_id: id,
                        channel_name: 'MISSING CHANNEL',
                        status: 'missing'
                    };
                }
                return this.channelsById[id];
            }.bind(this));
    };

    /**
     * Gets all groups of channels.
     *
     * @public
     */
    ChannelDictionary.prototype.getGroups = function () {
        return this.load()
            .then(function () {
                return this.groups;
            }.bind(this));
    };

    /**
     * Gets a specific group of channels, by key.
     *
     * @public
     */
    ChannelDictionary.prototype.getGroup = function (key) {
        return this.load()
            .then(function () {
                return this.groupsByKey[key];
            }.bind(this));
    }

    /**
     * Gets channel ids in a specific group.
     *
     * @public
     */
    ChannelDictionary.prototype.getGroupChannelIds = function (key) {
        return this.getGroup(key)
            .then(function (group) {
                return group.channelIds;
            });
    };

    /**
     * @private
     */
    ChannelDictionary.prototype.load = function () {
        if (this.loaded) {
            return Promise.resolve();
        }
        if (!this.loading) {
            this.loading = this.dataset.load()
                .then(this.fetchDictionaries)
                .then(this.combineDictionaries)
                .then(this.groupChannels)
                .then(function () {
                    this.loaded = true;
                }.bind(this));
        }
        return this.loading;
    };
    
    /**
     * @private
     */
    ChannelDictionary.prototype.loadOnSessionChange = function (session) {
        if (session) {
            this.loaded = false;
            this.loading = false;
            this.load();
        }
    };  

    /**
     * @private
     */
    ChannelDictionary.prototype.standardizeDictionary = function (
        channelDictionary
    ) {
        if (channelDictionary[0] &&
            channelDictionary[0].hasOwnProperty('channel-Mnemonic')) {
            channelDictionary = channelDictionary.map(function (row) {
                return {
                    channel_id: row['channel-ID'],
                    channel_name: row['channel-Mnemonic'],
                    data_type: row['channel-Type'],
                    dn_to_eu: row['DN2EU-flag'],
                    dn_units: row['DN-units'],
                    eu_units: row['EU-units'],
                };
            });
        }

        return _.sortBy(channelDictionary, 'channel_id');
    };

    /**
     * @private
     */
    ChannelDictionary.prototype.combineDictionaries = function (results) {
        var channelDictionary = results[0],
            enumerationDictionary = results[1];

        this.channelsById = _.keyBy(channelDictionary, 'channel_id');

        enumerationDictionary.forEach(function (chanEnumDef) {
            var id = chanEnumDef.channel_id;

            if (!this.channelsById[id]) {
                return;
            }

            if (!this.channelsById[id].enumerations) {
                this.channelsById[id].enumerations = [];
            }
            this.channelsById[id].enumerations.push(chanEnumDef);
        }, this);

        return channelDictionary;
    };

    /**
     * @private
     */
    ChannelDictionary.prototype.fetchDictionaries = function () {
        var fetching = [],
            channelDictionaryUrl = this.dataset.getActiveChannelDictionaryUrl(),
            channelEnumerationDictionaryUrl = this.dataset.getActiveChannelEnumerationDictionaryUrl();

        if (channelDictionaryUrl) {
            fetching.push(this.getDataTable(channelDictionaryUrl)
                .then(this.standardizeDictionary));
        } else {
            fetching.push(Promise.resolve([]));
        }
        if (channelEnumerationDictionaryUrl) {
            fetching.push(
                this.getDataTable(channelEnumerationDictionaryUrl)
            );
        } else {
            fetching.push(Promise.resolve([]));
        }

        return Promise.all(fetching);
    };

    /**
     * @private
     */
    ChannelDictionary.prototype.groupChannels = function (channels) {
        var byPrefix = _.groupBy(channels, function (channel) {
            return channel.channel_id.split('-')[0];
        });

        _.forEach(byPrefix, function (channels, prefix) {
            this.groupsByKey[prefix] = {
                name: prefix,
                key: prefix,
                channels: channels,
                channelIds: _.map(channels, 'channel_id')
            };
        }.bind(this));
        this.groups = _.sortBy(_.values(this.groupsByKey), 'name');
    };

    /**
     * @private
     */
    ChannelDictionary.prototype.getDataTable = function (url) {
        return mcws.dataTable(url).read();
    };

    return ChannelDictionary;
});
