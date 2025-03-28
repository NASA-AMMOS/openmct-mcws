import MCWSStreamProvider from './MCWSStreamProvider';

/**
 * Provides real-time streaming DataProduct data.
 * @memberof {vista/telemetry}
 */
class MCWSAlarmMessageStreamProvider extends MCWSStreamProvider {
    getUrl(domainObject) {
        return domainObject.telemetry?.alarmMessageStreamUrl;
    }

    getKey(domainObject) {
        return domainObject.telemetry.key;
    }

    getProperty(domainObject) {
        return domainObject.telemetry.property;
    }

    subscribe(domainObject, callback, options) {
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

        let unsubscribers = objects.map(object => super.subscribe(object, callback, options));

        return () => {
            unsubscribers.forEach(unsubscribe => unsubscribe());
        };
    }
}

export default MCWSAlarmMessageStreamProvider;
