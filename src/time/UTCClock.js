define([
    './Clock'
], function (
    Clock
) {

    var UTCClock = Clock.extend({
        key: 'utc.local',
        name: 'Local UTC',
        description: 'Ticks based on your local computer time.',
        initialize: function () {
            this.generateTick = this.generateTick.bind(this);
            this.generateTick();
            setInterval(this.generateTick, 1000/30);
        },
        generateTick: function () {
            this.tick(Date.now());
        }
    });

    return UTCClock;
});
