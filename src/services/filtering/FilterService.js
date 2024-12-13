import { EventEmitter } from 'eventemitter3';
import FilterURLHandler from './FilterUrlHandler';
import { isEqual, pickBy, isEmpty } from 'lodash';

class FilterService extends EventEmitter {
  constructor(openmct, config) {
    super();

    this.openmct = openmct;
    this.filtersConfig = config;

    this.filters = this.getAvailableFilters();

    this.openmct.on('start', () => {
      new FilterURLHandler(this, this.openmct);
    });
  }

  getAvailableFilters() {
    const filters = {};

    this.filtersConfig.forEach(config => filters[config.key] = {});

    return filters;
  }

  hasActiveFilters() {
    const activeFilters = this.getActiveFilters();
    const activeFiltersCount = Object.keys(activeFilters).length;

    return Boolean(activeFiltersCount);
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
    const clearedFilters = this.getAvailableFilters();
    
    this.updateFilters(clearedFilters);
  }
}

let filterServiceInstance = null;

export default function(openmct, config) {
    if (filterServiceInstance) {
      return filterServiceInstance;
    }

    if (config) {
      filterServiceInstance = new FilterService(openmct, config);
    }

    return filterServiceInstance;
}
