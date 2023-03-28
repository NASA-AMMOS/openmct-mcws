define([
], function (
) {
    function SCETTimeSystem(DEFAULT_UTC_FORMAT) {
        this.key = 'scet';
        this.name = 'SCET';
        this.cssClass = 'icon-clock';
        this.timeFormat = DEFAULT_UTC_FORMAT;
        this.durationFormat = 'duration';
        this.isUTCBased = true;
    }

    return SCETTimeSystem;
});
