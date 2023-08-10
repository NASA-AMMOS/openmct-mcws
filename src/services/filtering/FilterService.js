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

    this.filters = {};
    this.initialize();
  }

  initialize() {
    this.initializeFilters();

    this.openmct.on('start', () => {
      new FilterURLHandler(this, this.openmct);
    });
  }

  initializeFilters() {
    this.filtersConfig.forEach(config => this.filters[config.key] = {});
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
    }
  }

  updateFiltersFromParams(params) {
    const updatedFilters = {};

    this.updateFilters(updatedFilters);
  }

  clearFilters() {
    this.initializeFilters();
    this.emit('clear');
  }
}

let filterServiceInstance = null;

export default function(openmct, config) {
    if (!filterServiceInstance) {
        filterServiceInstance = new FilterService(openmct, config);
    }

    return filterServiceInstance;
}
