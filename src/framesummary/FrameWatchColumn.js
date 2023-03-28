define(function () {
    class FrameWatchColumn {
        constructor (key, title) {
            this.key = key;
            this.title = title;
        }

        getKey() {
            return this.key;
        }

        getTitle() {
            return this.title;
        }

        getMetadatum() {
            return undefined;
        }

        hasValueForDatum(telemetryDatum) {
            return telemetryDatum.hasOwnProperty(this.key);
        }

        getRawValue(telemetryDatum) {
            return telemetryDatum[this.key];
        }

        getFormattedValue(telemetryValue) {
            return telemetryValue;
        }

        getParsedValue(telemetryValue) {
            return telemetryValue;
        }
    };

    return FrameWatchColumn;
});
