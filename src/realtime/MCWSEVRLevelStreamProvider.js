/*global define*/

define([
    './MCWSStreamProvider',
    'lodash'
], function (
    MCWSStreamProvider,
    _
) {
    'use strict';

    /**
     * Provides real-time streaming EVR data by level.
     * @constructor
     * @augments {MCWSStreamProvider}
     * @memberof {vista/telemetry}
     */
    var MCWSEVRLevelStreamProvider = MCWSStreamProvider.extend({});

    MCWSEVRLevelStreamProvider.prototype.getUrl = function (domainObject) {
        if (domainObject.telemetry && domainObject.telemetry.level) {
            return domainObject.telemetry.evrStreamUrl;
        }
    };

    MCWSEVRLevelStreamProvider.prototype.getProperty = function (domainObject) {
        return 'level';
    };

    MCWSEVRLevelStreamProvider.prototype.getKey = function (domainObject) {
        return domainObject.telemetry.level;
    };

    return MCWSEVRLevelStreamProvider;
});
