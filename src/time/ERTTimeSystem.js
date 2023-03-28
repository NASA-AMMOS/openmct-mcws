define([
], function (
) {

    function ERTTimeSystem(DEFAULT_UTC_FORMAT) {
        this.key = 'ert';
        this.name = 'ERT';
        this.cssClass = 'icon-clock';
        this.timeFormat = DEFAULT_UTC_FORMAT;
        this.durationFormat = 'duration';
        this.isUTCBased = true;
    }

    return ERTTimeSystem;
});
