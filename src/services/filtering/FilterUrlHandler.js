import { isEqual, isEmpty } from 'lodash';

const GLOBAL_FILTER_PARAM_PREFIX = 'global_filter_';

export default class FilterURLHandler {
  constructor(filterService, openmct) {
    this.filterService = filterService;
    this.openmct = openmct;
    this.params = {};

    this.filterService.on('update', this.updateURLFromFilters.bind(this));
    openmct.router.on('change:params', this.updateFiltersFromURL.bind(this));

    this.updateFiltersFromURL();
  }

  getParams() {
    const params = {};
    const availableFilters = this.filterService.getAvailableFilters();
    const availableFiltersKeys = Object.keys(availableFilters);

    availableFiltersKeys.forEach((key) => {
      const value = this.openmct.router.getSearchParam(`${GLOBAL_FILTER_PARAM_PREFIX}${key}`);

      if (value) {
        params[key] = value;
      }
    });

    return params;
  }

  updateFiltersFromURL() {
    const params = this.getParams();

    if (!this.isChangedParams(params)) {
      return;
    }

    const filters = this.paramsToFilters(params);

    this.filterService.updateFilters(filters);

    this.params = params;
    this.updateAfterNavigation();
  }

  paramsToFilters(params) {
    const filters = {};

    Object.entries(params).forEach(([key, value]) => {
      filters[key] = { equals: value };
    });

    return filters;
  }

  updateAfterNavigation() {
    const params = this.getParams();
    const activeFilters = this.filterService.getActiveFilters();

    if (Object.keys(params).length !== Object.keys(activeFilters).length) {
      this.updateURLFromFilters(activeFilters);
    }

    const isDifferent = Object.entries(params).some(([paramKey, paramValue]) => {
      // shortcut for comparator
      const filterValue = activeFilters[paramKey]['equals'];

      return paramValue !== filterValue;
    });

    if (isDifferent) {
      this.updateURLFromFilters(activeFilters);
    }
  }

  isChangedParams(params) {
    return !isEqual(params, this.params);
  }

  updateURLFromFilters(filters) {
    const activeFilters = filters;
    const availableFilters = this.filterService.getAvailableFilters();
    const availableFiltersKeys = Object.keys(availableFilters);

    availableFiltersKeys.forEach((filterKey) => {
      const paramKey = `${GLOBAL_FILTER_PARAM_PREFIX}${filterKey}`;
      const filter = activeFilters[filterKey];

      if (!isEmpty(filter)) {
        const paramValue = filter['equals'];
        this.openmct.router.setSearchParam(paramKey, paramValue);
      } else {
        this.openmct.router.deleteSearchParam(paramKey);
      }
    });
  }
}
