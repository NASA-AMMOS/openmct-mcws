
import moment from 'moment';
import {
    DOY_PATTERN,
    inlineParseDOYString
} from './utils/DOY';

/**
 * Returns an appropriate time format based on the provided value and
 * the threshold required.
 * @private
 */
function getScaledFormat (m) {
    return [
        [".SSS", function(m) { return m.milliseconds(); }],
        [":ss", function(m) { return m.seconds(); }],
        ["HH:mm", function(m) { return m.minutes() || m.hours(); }],
        ["DDD", function(m) { return m.dayOfYear(); }],
        ["YYYY", function() { return true; }]
    ].filter(function (row){
        return row[1](m);
    })[0][0];
}

/**
 * Formatter for UTC timestamps in day of year format.
 *
 * @implements {Format}
 * @constructor
 */
function UTCDayOfYearFormat() {
    this.key = 'utc.day-of-year';
}

UTCDayOfYearFormat.prototype.FORMAT = 'YYYY-DDDDTHH:mm:ss.SSS';
UTCDayOfYearFormat.prototype.ACCEPTABLE_FORMATS = [
    UTCDayOfYearFormat.prototype.FORMAT,
    'YYYY-DDDTHH:mm:ss',
    'YYYY-DDDTHH:mm',
    'YYYY-DDDTHH',
    'YYYY-DDD',
    'YYYY-MM-DDTHH:mm:ss.SSS',
    'YYYY-MM-DDTHH:mm:ss',
    'YYYY-MM-DDTHH:mm',
    'YYYY-MM-DDTHH',
    'YYYY-MM-DD'
];

UTCDayOfYearFormat.prototype.format = function (value, scale) {
    if (value === undefined || value === '') {
        return value;
    }
    var m = moment.utc(value);
    if (typeof scale !== 'undefined') {
        var scaledFormat = getScaledFormat(m);
        if (scaledFormat) {
            return m.format(scaledFormat);
        }
    }
    return m.format(this.FORMAT);
};

UTCDayOfYearFormat.prototype.endOfDay = function (value) {
    return moment.utc(value).endOf('day').valueOf();
}

UTCDayOfYearFormat.prototype.parse = function (text) {
    if (text === undefined || typeof text === 'number') {
        return text;
    }

    if (DOY_PATTERN.test(text)) {
        return +inlineParseDOYString(text);
    }

    return moment.utc(text, this.ACCEPTABLE_FORMATS, true).valueOf();
};

UTCDayOfYearFormat.prototype.validate = function (text) {
    return text !== undefined && moment.utc(text, this.ACCEPTABLE_FORMATS, true).isValid();
};

export default UTCDayOfYearFormat;
