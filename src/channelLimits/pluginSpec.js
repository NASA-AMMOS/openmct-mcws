import ChannelLimitsProvider from './ChannelLimitsProvider';

describe('the channel limits provider', () => {
    let channelLimitsProvider;
    let limitEvaluator;

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
    const dnValueMetadata = {
        key: 'dn'
    };
    const euValueMetadata = {
        key: 'eu'
    };
    const redAlarmDatum = {
        ert: 'mock ert time',
        scet: 'mock scet time',
        sclk: 'moct sclk time',
        dn_alarm_state: 'RED',
        eu_alarm_state: 'RED',
    };
    const yellowAlarmDatum = {
        ert: 'mock ert time',
        scet: 'mock scet time',
        sclk: 'moct sclk time',
        dn_alarm_state: 'YELLOW',
        eu_alarm_state: 'YELLOW',
    };
    const noAlarmDatum = {
        ert: 'mock ert time',
        scet: 'mock scet time',
        sclk: 'moct sclk time',
        dn_alarm_state: 'NONE',
        eu_alarm_state: 'NONE',
    };

    beforeEach(() => {
        channelLimitsProvider = new ChannelLimitsProvider();
        limitEvaluator = channelLimitsProvider.getLimitEvaluator();
    });

    it('applies to channels and channel streams', () => {
        const applicableTypes = [
            'vista.channel',
            'vista.alarmMessageStream',
            'vista.channel.alarmNode',
        ];

        applicableTypes.map(type => {
            return { type: type};
        }).forEach(mockDomainObject => {
            expect(channelLimitsProvider.supportsLimits(mockDomainObject)).toBeTrue();
        });
    });

    it('does not apply to other data types', () => {
        const nonApplicableTypes = [
            'vista.evr',
            'vista.dataProducts',
            'vista.message',
        ];

        nonApplicableTypes.map(type => {
            return { type: type};
        }).forEach(mockDomainObject => {
            expect(channelLimitsProvider.supportsLimits(mockDomainObject)).toBeFalse();
        });
    });

    describe('the limit evaluator', () => {
        it('can evaluate datums in yellow state', function () {
            expect(limitEvaluator.evaluate(yellowAlarmDatum, dnValueMetadata))
                .toEqual(LIMITS.YELLOW);
            expect(limitEvaluator.evaluate(yellowAlarmDatum, euValueMetadata))
                .toEqual(LIMITS.YELLOW);
        });
    
        it('can evaluate datums in red state', function () {
            expect(limitEvaluator.evaluate(redAlarmDatum, dnValueMetadata))
                .toEqual(LIMITS.RED);
            expect(limitEvaluator.evaluate(redAlarmDatum, euValueMetadata))
                .toEqual(LIMITS.RED);
        });
    
        it('can evaluate datums without limit state', function () {
            expect(limitEvaluator.evaluate(noAlarmDatum, dnValueMetadata))
                .not.toBeDefined();
            expect(limitEvaluator.evaluate(noAlarmDatum, euValueMetadata))
                .not.toBeDefined();
        });
    
        it('does not evaluate on other keys', function () {
            const otherKeys = [
                'ert',
                'scet',
                'sclk',
            ];

            otherKeys.map(key => {
                return { key: key };
            }).forEach(valueMetadata => {
                expect(limitEvaluator.evaluate(redAlarmDatum, valueMetadata))
                    .not.toBeDefined();
                expect(limitEvaluator.evaluate(yellowAlarmDatum, valueMetadata))
                    .not.toBeDefined();
            });
        });
    
        it('does not evalute with no key', function () {
            const datums = [
                redAlarmDatum,
                yellowAlarmDatum,
                noAlarmDatum,
            ];

            datums.forEach(datum => {
                expect(limitEvaluator.evaluate(datum))
                    .not
                    .toBeDefined();
            });
        });
    });
});
