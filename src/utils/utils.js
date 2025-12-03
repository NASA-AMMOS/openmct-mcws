// Helper function to replace lodash groupBy
export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
}

export function keyBy(array, key) {
  return array.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key];
    result[groupKey] = item;
    return result;
  }, {});
}

export function setSortFilter(params) {
  if (window.openmctMCWSConfig?.disableSortParam === true) {
    delete params.sort;
  }
}

export function isLADQuery(options) {
  return options.strategy === 'latest';
}

export function setMaxResults(domainObject, options, params) {
  if (
    domainObject.telemetry.mcwsVersion >= 3.2 &&
    options.strategy !== 'comprehensive' &&
    window.openmctMCWSConfig?.maxResults !== undefined
  ) {
    params.max_records = window.openmctMCWSConfig.maxResults;
  }
}

export function setSortFilter(params) {
  if (window.openmctMCWSConfig?.disableSortParam === true) {
    delete params.sort;
  }
}

// Helper function to replace lodash debounce
export function debounce(func, wait = 0) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
