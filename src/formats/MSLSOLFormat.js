/*global define*/
define([
    'moment'
], function (
    moment
) {


    var MSL_EPOCH = moment.utc(Date.UTC(2012, 7, 5, 13, 49, 59)),
        MARS_SECONDS_PER_EARTH_SECOND = 1.02749125;

    /**
     * The MSLSolDate formatter takes UTC dates and converts them to the correct
     * martian sol.
     *
     * Martian sols are longer than earth days, so to simplify this and not
     * break every currently existing time library and package, we consider a
     * martian sol to be 24 hours, but the seconds are longer.
     *
     * Additionally, the martian epoch is defined differently for each mission.
     * This formatter defines the martian epoch according to that set by the
     * MSL team for Curiosity.
     *
     * Thus, it is assumed the numerical form of a SOL is a UTC date time,
     * and the string form of a SOL is a string specific to a SOL.  Any
     * intermediate forms should not be trusted.
     *
     * The basic translation path for UTC -> SOL is:
     * 1. Calculate earth seconds elapsed since SOL0
     * 2. Convert earth seconds elapsed to mars seconds elapsed
     * 3. Convert mars seconds elapsed to SOL text format.
     *
     * Converting from a SOL -> UTC is done as follows:
     * 1. Parse special SOL format string to determine mars seconds elapsed
     * 2. Convert mars seconds elapsed to earth seconds elapsed.
     * 3. Calculate UTC value by adding SOL0 to earth seconds elapsed.
     *
     * @implements {Format}
     * @constructor
     */
    function MSLSOLFormat() {
        this.key = 'msl.sol';
    }



    MSLSOLFormat.prototype.FORMAT = '[SOL]-DDD[M]HH:mm:ss.SSS';
    MSLSOLFormat.prototype.TIME_FORMAT = '[M]HH:mm:ss.SSS';
    MSLSOLFormat.prototype.TIME_FORMATS = [
        MSLSOLFormat.prototype.TIME_FORMAT,
        '[M]HH:mm:ss.SSS',
        '[M]HH:mm:ss',
        '[M]HH:mm',
        '[M]HH'
    ];

    MSLSOLFormat.prototype.PATTERN =
        /SOL-(\d+)([M]\d{2}:\d{2}:\d{2}\.\d{0,4})?/;

    /**
     * @param {Number} utcValue a numerical representation of a utc date.
     * @returns {String} the utc date as a string representing MSL-SOL time.
     */
    MSLSOLFormat.prototype.format = function (utcValue) {
        if (!utcValue) {
            return '';
        }

        if (this.validate(utcValue)) {
            return utcValue;
        }

        var earthTimeElapsed = moment.utc(utcValue) - MSL_EPOCH,
            marsTimeElapsed = earthTimeElapsed / MARS_SECONDS_PER_EARTH_SECOND,
            solDecimal = marsTimeElapsed / moment.utc(0).add(1, 'day'),
            sol = Math.floor(solDecimal),
            timeDecimal = solDecimal - sol,
            time = moment.utc(timeDecimal * moment.utc(0).add(1, 'day'));

        sol = String(sol);
        while (sol.length < 4) {
            sol = '0' + sol;
        }

        return 'SOL-' + sol + time.format(this.TIME_FORMAT);
    };

    /**
     *
     * @param {String} solDate a string sol date e.g. SOL-0000T12:00:00.
     * @returns {Number} the utc datetime equivalent of the sol.
     */
    MSLSOLFormat.prototype.parse = function (text) {
        if (!this.validate(text)) {
            return undefined;
        }
        var matches = this.PATTERN.exec(text),
            sol = matches[1],
            time = matches[2],
            solValue = moment.utc(0).add(sol, 'days'),
            timeValue = time ?
                moment.utc(time, this.TIME_FORMATS) : moment.utc(0),
            marsTimeElapsed = solValue.add({
                hours: timeValue.hours(),
                minutes: timeValue.minutes(),
                seconds: timeValue.seconds(),
                milliseconds: timeValue.milliseconds()
            }),
            earthTimeElapsed = marsTimeElapsed *
                MARS_SECONDS_PER_EARTH_SECOND,
            value = MSL_EPOCH + Math.round(earthTimeElapsed);

        return value;
    };

    MSLSOLFormat.prototype.validate = function (text) {
        return this.PATTERN.test(text);
    };

    return MSLSOLFormat;

});
