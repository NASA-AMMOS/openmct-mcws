define(["lodash"], function (_) {

    /**
     * Used to build parameterized MCWS URLs (e.g. with filters, sort order,
     * et cetera specified).
     *
     * TODO: This is a candidate for inclusion (in some form) in the
     * MCWS adapter itself.
     *
     * @param baseUrl
     * @constructor
     */
    function MCWSURLBuilder(baseUrl) {
        this.baseUrl = baseUrl;
        this.filters = [];
    }

    /**
     * Specify a filtering rule to be included in query parameters.
     *
     * @param {string} key the column to filter upon
     * @param {string} value the value to filter buy
     * @param {string} [operator] the operator to use for filtering;
     *        defaults to "="
     */
    MCWSURLBuilder.prototype.filter = function (key, value, operator) {
        operator = operator || "=";
        this.filters.push({
            key: key,
            value: value,
            operator: operator
        });
    };

    /**
     * Specify the sort order for this request.
     * @param {string} key the column to sort by
     */
    MCWSURLBuilder.prototype.sort = function (key) {
        this.sortValue = key;
    };

    /**
     * Get a URL including all sort and filter parameters previously specified.
     * @returns {string} the fully-paramaterized URL
     */
    MCWSURLBuilder.prototype.url = function () {
        var filterValue = "(" + this.filters.map(function (filter) {
            return filter.key + filter.operator + filter.value;
        }).join(',') + ")";

        var queryParameters = {};

        if (this.filters.length > 0) {
            queryParameters.filter = filterValue;
        }

        if (this.sortValue) {
            queryParameters.sort = this.sortValue;
        }

        var queryString = _.map(queryParameters, function (value, key) {
            return key + "=" + value;
        }).join("&");

        return encodeURI(this.baseUrl + "?" + queryString);
    };

    return MCWSURLBuilder;
});
