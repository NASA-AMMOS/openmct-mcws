const LIMITS = {
    RED: {
        cssClass: 'is-limit--red',
        name: 'RED'
    },
    YELLOW: {
        cssClass: 'is-limit--yellow',
        name: 'YELLOW'
    }
};

export default class ChannelLimitsProvider {
    getLimitEvaluator() {
        return {
            evaluate: (datum, valueMetadata) => {
                const key = valueMetadata && valueMetadata.key;
                const validKeys = [
                    'dn',
                    'eu',
                    'enum',
                ];
                const hasValidKeys = validKeys.some(validKey => key && key.includes(validKey));

                if (!hasValidKeys) {
                    return;
                }

                const alarmKey = getAlarmKey(key);
                const alarmValue = datum[alarmKey];

                return LIMITS[alarmValue];
            }
        };

        function getAlarmKey(key) {
            let alarmKey = key;
            const alarmStateSuffix = '_alarm_state';

            if (!alarmKey.includes(alarmStateSuffix)) {
                alarmKey = alarmKey + alarmStateSuffix;
            }

            // enum alarms are dn alarms
            alarmKey.replace('enum_', 'dn_');

            return alarmKey;
        }
    }

    getLimits() {
        return {
            limits: () => Promise.resolve(LIMITS)
        };
    }

    supportsLimits(domainObject) {
        const type = domainObject.type;

        return (
            type === 'vista.channel'
            || type === 'vista.alarmMessageStream'
            || type === 'vista.channel.alarmNode'
        );
    }
}
