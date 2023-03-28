export const DOY_PATTERN = /^\d{4}-\d{3}T\d{2}:\d{2}:\d{2}.\d{1,6}/;

const NORMAL_MONTH_DAYS = [ 0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365 ];
const LEAP_MONTH_DAYS = [ 0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366 ];

/**
 * Optimized parser for a DOY String, about 30x faster than moment.
 * See https://jsperf.com/parsing-date-strings-that-use-day-of-year for
 * testing data.
 */
export function inlineParseDOYString(doyString) {
    const year = Number(doyString.slice(0, 4));
    const doy = Number(doyString.slice(5, 8));
    let month;
    let date;

    if (((year & 3) === 0) && (((year % 100) !== 0) || ((year % 400) === 0))) {
        for (let i = 0; i < 13; i++) {
            if (doy <= LEAP_MONTH_DAYS[i+1]) {
                month = i;
                date = doy - LEAP_MONTH_DAYS[i];
                break;
            }
        }
    } else {
        for (let i = 0; i < 13; i++) {
            if (doy <= NORMAL_MONTH_DAYS[i+1]) {
                month = i;
                date = doy - NORMAL_MONTH_DAYS[i];
                break;
            }
        }
    }

    const hours = Number(doyString.slice(9, 11));
    const minutes = Number(doyString.slice(12, 14));
    const seconds = Number(doyString.slice(15, 17));
    const milliseconds = Number(doyString.slice(18, 21));

    return Date.UTC(year, month, date, hours, minutes, seconds, milliseconds);
}