/*global define*/

define([
    './MCWSStreamProvider'
], function (
    MCWSStreamProvider
) {
    'use strict';

    /**
     * Provides real-time streaming DataProduct data.
     * @constructor
     * @augments {MCWSStreamProvider}
     * @memberof {vista/telemetry}
     */
    var MCWSAlarmMessageStreamProvider = MCWSStreamProvider.extend({
        constructor: function (openmct, vistaTime) {
            MCWSStreamProvider.call(this, openmct, vistaTime);
        }
    });

    MCWSAlarmMessageStreamProvider.prototype.getUrl = function (domainObject) {
        return domainObject.telemetry && domainObject.telemetry.alarmMessageStreamUrl;
    };

    MCWSAlarmMessageStreamProvider.prototype.getKey = function (domainObject) {
        return domainObject.telemetry.key;
    };

    MCWSAlarmMessageStreamProvider.prototype.getProperty = function (domainObject) {
        return domainObject.telemetry.property;
    };

    MCWSAlarmMessageStreamProvider.prototype.notifyWorker = function (key, value) {
        MCWSStreamProvider.prototype.notifyWorker.call(this, key, value);
    };

    MCWSAlarmMessageStreamProvider.prototype.subscribe = function (domainObject, callback, options) {
        let { telemetry: { alarmLevel = 'any'} = {}} = domainObject;
        alarmLevel = alarmLevel.toUpperCase();
        let objects = [
            {
                telemetry: {
                    key: 'RED',
                    property: 'dn_alarm_state'
                }
            },
            {
                telemetry: {
                    key: 'RED',
                    property: 'eu_alarm_state'
                }
            },
            {
                telemetry: {
                    key: 'YELLOW',
                    property: 'dn_alarm_state'
                }
            },
            {
                telemetry: {
                    key: 'YELLOW',
                    property: 'eu_alarm_state'
                }
            }
        ];
                
        if (alarmLevel === 'RED' || alarmLevel === 'YELLOW') {
            objects = objects.filter(object => object.telemetry.key === alarmLevel);
        }

        objects.forEach((object) => {
            object.telemetry.alarmMessageStreamUrl = domainObject.telemetry.alarmMessageStreamUrl;
            object.telemetry.values = domainObject.telemetry.values;
        });

        let unsubscribers = objects.map(object => MCWSStreamProvider.prototype.subscribe.call(this, object, callback, options));

        return () => {
            unsubscribers.forEach(unsubscribe => unsubscribe());
        };

    }

    return MCWSAlarmMessageStreamProvider;
});
