import EventEmitter from 'EventEmitter';
import FilterURLHandler from './FilterUrlHandler';
import isEqual from 'lodash/isequal';
import pickBy from 'lodash/pickby';
import isEmpty from 'lodash/isempty';

class FilterService extends EventEmitter {
  constructor(openmct, config) {
    super();

    this.openmct = openmct;
    this.filtersConfig = config;

    this.filters = this.getClearedFilters(this.filtersConfig);

    this.openmct.on('start', () => {
      new FilterURLHandler(this, this.openmct);
    });
  }

  getClearedFilters(filterConfig) {
    const filters = {};

    filterConfig.forEach(config => filters[config.key] = {});

    return filters;
  }

  hasActiveFilters() {
    const activeFilters = this.getActiveFilters();
    const activeFiltersCount = Object.keys(activeFilters).length;

    return Boolean(activeFiltersCount);
  }

  getAvailableFilters() {
    return Object.keys(this.filters);
  }

  isActive(filter) {
    return typeof filter === 'object' && !isEmpty(filter);
  }

  getActiveFilters() {
    return pickBy(this.filters, this.isActive);
  }

  updateFilters(updatedFilters) {
    const isChangedFilters = Object.entries(updatedFilters)
      .some(([key, filter]) => !isEqual(filter, this.filters[key]));

    if (isChangedFilters) {
      Object.assign(this.filters, updatedFilters);

      this.emit('update', this.filters);

      this.hasActiveFilters()
        ? this.openmct.notifications.info('Global filters enabled.')
        : this.openmct.notifications.info('Global filters cleared.');

      this.handleFilterChange();
    }
  }

  // clear plots and tables before requery
  // and then force a requery
  handleFilterChange() {
    this.openmct.objectViews.emit('clearData');
    this.openmct.time.bounds(this.openmct.time.bounds());
  }

  updateFiltersFromParams(params) {
    const updatedFilters = {};

    this.updateFilters(updatedFilters);
  }

  clearFilters() {
    const clearedFilters = this.getClearedFilters(this.filtersConfig);
    
    this.updateFilters(clearedFilters);
  }
}

let filterServiceInstance = null;

export default function(openmct, config) {
    if (!filterServiceInstance) {
        filterServiceInstance = new FilterService(openmct, config);
    }

    return filterServiceInstance;
}
