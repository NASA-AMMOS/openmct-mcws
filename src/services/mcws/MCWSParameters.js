const OPERATOR_MAP = {
    'eq': '=',
    'neq': '!=',
    'gt': '>',
    'lt': '<',
    'gte': '>=',
    'lte': '<=',
    'in': 'in'
};
const DEFAULT_OPERATOR = 'eq';
const SORT_MAP = {
    'asc': '',
    'desc': '-'
};
const DEFAULT_SORT = 'asc';
const PARAMETER_TRANSFORMS = {
    sort(val) {
        if (!Array.isArray(val)) {
            val = [val];
        }

        const formattedSortString =  val.map((sortTerm) => {
            const termParts = sortTerm.split('__');
            const term = termParts[0];
            let direction = SORT_MAP[DEFAULT_SORT];

            if (sortTerm.length === 2) {
                direction = SORT_MAP[termParts[1]];
                
                if (!direction) {
                    throw new Error(`Unknown Sort Direction: ${termParts[1]}`);
                }
            }

            return `${direction}${term}`;
        }).join(',')

        return `(${formattedSortString})`;
    },
    filter(val) {
        if (typeof val !== 'object') {
            throw new Error('Filter Parameters must be an object.');
        }

        const keys = Object.keys(val);
        const formattedFilterString = keys.map((k) => {
            const keyParts = k.split('__');
            const key = keyParts[0];
            const termValue = val[k];
            const operator = keyParts.length === 2 ?
                    OPERATOR_MAP[keyParts[1]] :
                    OPERATOR_MAP[DEFAULT_OPERATOR];

            if (operator === 'in' && Array.isArray(termValue)) {
                return `${key}=(${termValue.join(',')})`;
            }

            return `${key}${operator}${termValue}`;
        }).join(',');

        return `(${formattedFilterString})`;
    }
};
const FALLBACK_TRANSFORM = (val) => val;


/**
 * Converter from JavaScript objects to MCWS-style parameters.  Keys and
 * their values are directly copied to a new object, with special handling
 * for the following keys:
 *
 *
 * sort: takes a single string or an array of strings representing one or
 * more columns to sort by.  Can specify per column sort direction by adding
 * suffixes to column names: '__asc' for ascending and '__desc' for
 * descending.  Default is ascending.  Examples:
 *
 *  * `{sort: 'scet__asc'}` would sort by scet, ascending.
 *  * `{sort: ['scet__asc', 'channel_id__desc']}` would sort by scet
 *    ascending and then by channel_id descending.
 *
 *
 * filter: takes an object representing filter terms and their values.  The
 * default operator is equality, but different operators can be used by
 * adding a suffix (prefixed by __) to the end of the key,  The following
 * operators are supported:
 *
 *  * 'eq': equal, default operator.
 *  * 'neq': not-equal
 *  * 'gt': greater than
 *  * 'lt': less than
 *  * 'gte': greater than or equal to
 *  * 'lte': less than or equal to
 *  * 'in': value matches any given value.  Must be an Array of potential
 *    values.
 *
 *  Examples of filter:
 *
 *  * `{filter: {channel_id: 'A-0001'}}` would match for channel_ids equal
 *    to 'A-0001'.
 *  * `{filter: {scet__gte: '2015-030T00:00:00.000'}}` would filter for scet
 *    greater than or equal to '2015-030T00:00:00.000';
 *  * `{filter: {channel_id__in: ['A-0001', 'B-0001']}}` would match any
 *     channel_id in the set 'A-0001', 'B-0001'.
 *
 * @constructor
 */

export default function MCWSParameters(parameters = {}) {
    const paramKeys = Object.keys(parameters);

    return paramKeys.reduce((result, paramKey) => {
        const transform = PARAMETER_TRANSFORMS[paramKey] ?? FALLBACK_TRANSFORM;
        const paramValue = parameters[paramKey];

        result[paramKey] = transform(paramValue);

        return result;
    }, {});
}
