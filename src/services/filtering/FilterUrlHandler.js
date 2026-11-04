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

    // A URL that specifies any global filter is authoritative for the whole
    // global filter set: filters absent from the URL are cleared. A URL with
    // no global filter params (e.g. in-app navigation, which drops them)
    // leaves the active filters alone; updateAfterNavigation re-adds them.
    if (Object.keys(params).length) {
      this.filterService.updateFilters(this.paramsToFilters(params));
    }

    this.params = params;
    this.updateAfterNavigation();
  }

  paramsToFilters(params) {
    const filters = this.filterService.getAvailableFilters();

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
      const filterValue = activeFilters[paramKey]?.['equals'];

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
