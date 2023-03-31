/*global define,Promise*/

define([
    '../lib/extend',
    'lodash',
    './MCWSStreamWorker',
    'services/session/SessionService'
], function (
    extend,
    _,
    runMCWSStreamWorker,
    sessionServiceDefault
) {
    'use strict';

    /**
     * Provides real-time streaming telemetry for channels/EVRs with an
     * associated WebSocket URL. Uses user selection from `sessionService`
     * in order to filter down to an appropriate topic.
     *
     * @param {vista/sessions.SessionService} sessions service providing
     *        information about user-selected topics/sessions
     * @constructor
     * @implements {TelemetryService}
     * @memberof vista/telemetry
     */
    function MCWSStreamProvider(
        openmct,
        vistaTime
    ) {
        this.openmct = openmct;
        this.vistaTime = function () {
            return vistaTime;
        };
        this.globalStaleness = function () {
            return openmct.$injector.get('vista.staleness');
        };

        this.sessions = sessionServiceDefault.default();

        this.subscriptions = {};
        this.requests = {};
    }

    MCWSStreamProvider.extend = extend;

    MCWSStreamProvider.prototype.processGlobalStaleness = function (data, latestTimestamp) {
        const globalStaleness = this.globalStaleness();

        if (!Object.keys(globalStaleness).length) {
            return;
        }

        if (!globalStaleness.latestTimestamp) {
            globalStaleness.updateLatestTimestamp(latestTimestamp);
            return;
        }
        
        if (globalStaleness.isStale(latestTimestamp)) {
            data.forEach(datum => {
                datum.isStale = 1;
            });
        } else {
            data.forEach(datum => {
                datum.isStale = 0;
            });
        }

        globalStaleness.updateLatestTimestamp(latestTimestamp);
    };

    MCWSStreamProvider.prototype.onmessage = function (message) {
        var data = message.data;
        var url = data.url;
        var key = data.key;
        var values = data.values;
        var subscriptions = (this.subscriptions[url] || {})[key] || [];
        var timestamp = Date.now();

        this.processGlobalStaleness(values || [], timestamp);

        subscriptions.forEach(function (subscription) {
            this.vistaTime().update(values[0]);
            values.forEach(subscription.callback);
        }, this);

        //Communicate websocket timeout and errors to users
        if (data.onclose && data.code === 1006) {
            let dialog = this.openmct.overlays.dialog({
                iconClass: "alert",
                message: 'Real-time data connection lost - data may not be displayed as expected. Please reload page to reconnect.',
                buttons: [
                    {
                        label: "Cancel",
                        callback: function () {
                            dialog.dismiss();
                        }
                    },
                    {
                        label: "Reload",
                        emphasis: true,
                        callback: function () {
                            dialog.dismiss();
                            window.location.reload();
                        }
                    }
                ]
            });

        } else if (data.onerror) {
            this.openmct.notifications.error('Websocket Error, please see console for details');
            console.error(`Websocket Error - Code:${data.code}, Error:${data.reason}`);
        }
    };

    MCWSStreamProvider.prototype.worker = function () {
        const worker = runMCWSStreamWorker.default();

        worker.onmessage = this.onmessage.bind(this);

        this.worker = function () {
            return worker;
        }

        const updateTopic = function (newValue) {
            this.notifyWorker('topic', newValue);
        }.bind(this);

        updateTopic(this.sessions.getActiveTopicOrSession());

        this.sessions.listen(updateTopic);

        return worker;
    };

    /**
     * Post a message to the associated worker.
     * @param {string} key identifier for the type of message
     * @param {string} value data associated with the message
     * @private
     */
    MCWSStreamProvider.prototype.notifyWorker = function (key, value) {
        this.worker().postMessage({ key: key, value: value });
    };

    /**
     * Add a callback function associated with a specific domain object.
     * @param {DomainObject} domainObject the requested object
     * @param {Function} callback the callback to add
     * @private
     */
    MCWSStreamProvider.prototype.addCallback = function (domainObject, callback) {
        var url = this.getUrl(domainObject),
            key = this.getKey(domainObject),
            subscriptions = this.subscriptions;

        subscriptions[url] = subscriptions[url] || {};
        subscriptions[url][key] = subscriptions[url][key] || [];
        subscriptions[url][key].push({
            callback: callback,
            domainObject: domainObject
        });
    };

    /**
     * Remove a callback function associated with a specific domain object.
     * @param {DomainObject} domainObject the requested object
     * @param {Function} callback the callback to remove
     * @private
     */
    MCWSStreamProvider.prototype.removeCallback = function (domainObject, callback) {
        var url = this.getUrl(domainObject),
            key = this.getKey(domainObject),
            subscriptions = this.subscriptions;

        subscriptions[url] = subscriptions[url] || {};
        subscriptions[url][key] = subscriptions[url][key] || [];
        subscriptions[url][key] = subscriptions[url][key].filter(
            function (c) { return c.callback !== callback; }
        );

        if (subscriptions[url][key].length < 1) {
            delete subscriptions[url][key];
            if (Object.keys(subscriptions[url]).length < 1) {
                delete subscriptions[url];
            }
        }
    };

    MCWSStreamProvider.prototype.supportsSubscribe = function (domainObject) {
        return !!this.getUrl(domainObject);
    };

    MCWSStreamProvider.prototype.subscribe = function (domainObject, callback, options) {
        if (options) {
            options = { ...options };
            if (options.filters) {
                options.filters = this.removeFiltersIfAllSelected(domainObject, options.filters);
            }    
        }

        var active = true,
            message = {
                url: this.getUrl(domainObject),
                key: this.getKey(domainObject),
                property: this.getProperty(domainObject),
                mcwsVersion: domainObject.telemetry.mcwsVersion,
                extraFilterTerms: options &&
                    options.filters &&
                    this.serializeFilters(options.filters)
            };

        function unsubscribe() {
            if (!active) {
                throw new Error("Tried to unsubscribe more than once.");
            }

            this.removeCallback(domainObject, callback);
            this.notifyWorker('unsubscribe', message);
            active = false;
        }

        this.addCallback(domainObject, callback);
        this.notifyWorker('subscribe', message);

        return _.bind(unsubscribe, this);
    };

    MCWSStreamProvider.prototype.removeFiltersIfAllSelected = function(domainObject, filters) {
        let valuesWithFilters = this.openmct.telemetry.getMetadata(domainObject)
            .values()
            .filter((metadatum) => metadatum.filters !== undefined)
            .reduce((map, metadatum) => {
                map[metadatum.key] = metadatum.filters;
                return map;
            }, {})

        Object.keys(filters).forEach((key) => {
            let metadataFilters = valuesWithFilters[key];
            if (metadataFilters) {
                metadataFilters.forEach((filter) => {
                    if (filter.possibleValues) {
                        let allSelected = filter.possibleValues.every(possibleValue => {
                            return filters[key].equals &&
                                filters[key].equals.includes(possibleValue.value);
                        });
                        if (allSelected) {
                            filters[key] = {};
                        }
                    }
                });
            }
        });

        return filters;

    }

    MCWSStreamProvider.prototype.serializeFilters = function (filters) {
        let attributeKeys = Object.keys(filters);
        let keysToFilterStringsMap = attributeKeys.reduce((extraFilterTerms, attributeKey) => {
                let filtersForAttribute = filters[attributeKey];
                extraFilterTerms[attributeKey] = Object.keys(filtersForAttribute)
                    .reduce((filterString, comparator) => {
                        if (comparator === 'equals') {
                            let equalsFilters;
                            if (filtersForAttribute[comparator] instanceof Array){
                                equalsFilters = `${filtersForAttribute[comparator].join(',')}`;
                            } else {
                                equalsFilters = `${filtersForAttribute[comparator]}`;
                            }
                            if (equalsFilters !== '')
                                filterString += `(${equalsFilters})`;
                        }
                        return filterString;
                    }, '');
            return extraFilterTerms;
        }, {});
        return keysToFilterStringsMap;
    }

    /**
     * Get the WebSocket URL for streaming data associated with this request.
     * Intended to be overridden, e.g. for EVR stream provider.
     * @private
     * @param {DomainObject} domainObject the requested object
     * @returns {string} the WebSocket URL
     */
    MCWSStreamProvider.prototype.getUrl = function (domainObject) {
        throw new Error("getUrl not implemented.");
    };

    /**
     * Get a key which identifies this request (relative to other requests
     * from the same source), such as a channel ID.
     * @private
     * @param {DomainObject} domainObject the requested object
     * @returns {string} the key
     */
    MCWSStreamProvider.prototype.getKey = function (domainObject) {
        throw new Error("getKey not implemented.");
    };

    /**
     * Get the name of the property of telemetry data points which will
     * contain keys corresponding to original requests.
     * @see {vista/telemetry.MCWSStreamProvider#getKey}
     * @private
     * @returns {string} the property name
     */
    MCWSStreamProvider.prototype.getProperty = function (domainObject) {
        throw new Error("getProperty not implemented.");
    };

    return MCWSStreamProvider;
});
