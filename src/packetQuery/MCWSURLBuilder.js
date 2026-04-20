/**
 * Used to build parameterized MCWS URLs (e.g. with filters, sort order,
 * et cetera specified).
 *
 * TODO: This is a candidate for inclusion (in some form) in the
 * MCWS adapter itself.
 *
 * @param baseUrl
 */
class MCWSURLBuilder {
  constructor(baseUrl) {
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
  filter(key, value, operator) {
    operator = operator || '=';
    this.filters.push({
      key: key,
      value: value,
      operator: operator
    });
  }

  /**
   * Specify the sort order for this request.
   * @param {string} key the column to sort by
   */
  sort(key) {
    this.sortValue = key;
  }

  /**
   * Get a URL including all sort and filter parameters previously specified.
   * @returns {string} the fully-parameterized URL
   */
  url() {
    const filterValue =
      '(' +
      this.filters
        .map((filter) => {
          return filter.key + filter.operator + filter.value;
        })
        .join(',') +
      ')';

    const queryParameters = {};

    if (this.filters.length > 0) {
      queryParameters.filter = filterValue;
    }

    if (this.sortValue) {
      queryParameters.sort = this.sortValue;
    }

    const queryString = Object.entries(queryParameters)
      .map(([key, value]) => {
        return key + '=' + value;
      })
      .join('&');

    return encodeURI(this.baseUrl + '?' + queryString);
  }
}

export default MCWSURLBuilder;
