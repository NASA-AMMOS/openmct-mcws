define([
    './Clock'
], function (
    Clock
) {

    var LADClock = Clock.extend({
        initialize: function (source) {
            this.description = "Ticks based on the latest " + source +
                " value received from the server.";
            this.key = source + '.lad';
            this.name = "Latest " + source;
        }
    });

    return LADClock;
});
