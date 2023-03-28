define([
    './MSLSOLFormat',
    './LMSTFormat',
    './SCLKFloat64Format',
    './UTCDayOfYearFormat',
    './UTCFormat',
    './JSONStringFormat'
], function (
    MSLSOLFormat,
    LMSTFormat,
    SCLKFloat64Format,
    UTCDayOfYearFormat,
    UTCFormat,
    JSONStringFormat
) {

    function FormatPlugin(options) {
        return function install(openmct) {
            openmct.telemetry.addFormat(new UTCDayOfYearFormat.default());
            openmct.telemetry.addFormat(new UTCFormat.default());
            openmct.telemetry.addFormat(new MSLSOLFormat());
            openmct.telemetry.addFormat(new LMSTFormat());
            openmct.telemetry.addFormat(new SCLKFloat64Format());
            openmct.telemetry.addFormat(new JSONStringFormat());
        }
    }

    return FormatPlugin;
});
