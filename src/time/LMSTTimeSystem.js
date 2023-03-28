define([
    'moment'
], function (
    moment
) {
    function LMSTTimeSystem() {
        this.key = 'lmst';
        this.name = 'LMST';
        this.cssClass = 'icon-clock';
        this.timeFormat = 'lmst';
        this.durationFormat = 'duration';
        this.isUTCBased = false;
    }

    LMSTTimeSystem.prototype.defaults = function () {
        var mode = this.$injector.get('timeConductorViewService').mode();
        if (mode === 'fixed') {
            var nowLST = this.solFormat.format(moment.utc());
            var sol = Number(/SOL-(\d+)M/.exec(nowLST)[1]);
            var start = this.solFormat.parse('SOL-' + sol);
            var end = this.solFormat.parse('SOL-' + (sol + 1));
            return {
                bounds: {
                    start: +start,
                    end: +end
                },
                deltas: {
                    start: 0,
                    end: 0
                }
            };
        }

        throw new Error('Unknown mode: ' + mode);
    };

    return LMSTTimeSystem;
});
