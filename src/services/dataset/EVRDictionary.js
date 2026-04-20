import mcws from 'services/mcws/mcws.js';
import sessionServiceDefault from 'services/session/SessionService.js';

// Helper function to replace lodash sortBy
function sortBy(array, key) {
  return [...array].sort((a, b) => {
    const aVal = typeof key === 'function' ? key(a) : a[key];
    const bVal = typeof key === 'function' ? key(b) : b[key];
    if (aVal < bVal) return -1;
    if (aVal > bVal) return 1;
    return 0;
  });
}

// Helper function to replace lodash groupBy
function groupBy(array, key) {
  return array.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
}

// Helper function to replace lodash forEach
function forEach(obj, callback) {
  Object.entries(obj).forEach(([key, value]) => {
    callback(value, key);
  });
}

// Helper function to replace lodash map
function map(array, key) {
  return array.map((item) => (typeof key === 'function' ? key(item) : item[key]));
}

// Helper function to replace lodash keys
function keys(obj) {
  return Object.keys(obj);
}

// Helper function to replace lodash keyBy
function keyBy(array, key) {
  return array.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key];
    result[groupKey] = item;
    return result;
  }, {});
}

// Helper function to replace lodash uniqBy
function uniqBy(array, key) {
  const seen = new Set();
  return array.filter((item) => {
    const val = typeof key === 'function' ? key(item) : item[key];
    if (seen.has(val)) {
      return false;
    }
    seen.add(val);
    return true;
  });
}

class EVRDictionary {
  constructor(dataset) {
    this.dataset = dataset;
    this.sessions = sessionServiceDefault();

    this.sessions.listen(this.loadOnSessionChange);
  }

  load() {
    if (this.loaded) {
      return Promise.resolve();
    }
    if (this.loading) {
      return this.loading;
    }

    const evrDictionaryUrl = this.dataset.getActiveEvrDictionaryUrl();

    return (this.loading = this.dataset.load().then(() => {
      return mcws
        .dataTable(evrDictionaryUrl)
        .read()
        .then((evrs) => {
          const grouped = groupBy(sortBy(evrs, 'evr_name'), 'module');
          this.byModule = {};
          forEach(grouped, (evrGroup, module) => {
            this.byModule[module] = map(evrGroup, 'evr_name');
          });
          this.modules = sortBy(keys(this.byModule));
          this.byName = keyBy(evrs, 'evr_name');
          this.levels = map(uniqBy(evrs, 'level'), 'level');
          this.loaded = true;
        });
    }));
  }

  loadOnSessionChange = (session) => {
    if (session) {
      this.loading = false;
      this.loaded = false;
      this.load();
    }
  };

  getLevels() {
    return this.load().then(() => {
      return this.levels;
    });
  }

  getModules() {
    return this.load().then(() => {
      return this.modules;
    });
  }

  getModuleEVRs(module) {
    return this.load().then(() => {
      return this.byModule[module];
    });
  }
}

export default EVRDictionary;
