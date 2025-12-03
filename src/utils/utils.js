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

// Helper function to replace lodash keyBy
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