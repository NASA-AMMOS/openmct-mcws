import EventEmitter from 'EventEmitter';
import isEqual from 'lodash/isequal';
import pickBy from 'lodash/pickby';
import isEmpty from 'lodash/isempty';

class FilterService extends EventEmitter {
  constructor(openmct, config) {
    super();

    this.openmct = openmct;
    this.filtersConfig = config;

    this.filters = {};
    this.initializeFilters();
  }

  initializeFilters() {
    this.filtersConfig.forEach(config => this.filters[config.key] = {});
  }

  hasActiveFilters() {
    return Boolean(this.getActiveFilters());
  }

  getFilters() {
    return this.filtersConfig;
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
      console.log(this.filters);
      this.emit('update', this.filters);
    }
  }

  clearFilters() {
    this.initializeFilters();
    this.emit('clear');
  }

  getValueForParam(key) {
    return `(${this.filters[key].join(',')})`;
  }
}

let filterServiceInstance = null;

export default function(openmct, config) {
    if (!filterServiceInstance) {
        filterServiceInstance = new FilterService(openmct, config);
    }

    return filterServiceInstance;
}
