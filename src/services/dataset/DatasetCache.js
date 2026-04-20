import Dataset from './Dataset.js';
import mcwsClient from 'services/mcws/MCWSClient.js';

/**
 * Provide a single place for fetching datasets so that there aren't
 * duplicates in existence.
 */
class DatasetCache {
  constructor(openmct) {
    this.openmct = openmct;
    this.datasets = {};
    this.pending = {};
    this.reloading = false;
  }

  async get(domainObject) {
    let isDomainObject = false;
    let identifier = domainObject;

    if (domainObject.identifier) {
      isDomainObject = true;
      identifier = domainObject.identifier;
    }

    const keyString = this.openmct.objects.makeKeyString(identifier);

    if (!this.datasets[keyString]) {
      if (isDomainObject) {
        this.datasets[keyString] = new Dataset(domainObject);

        this.#observe(domainObject);
      } else {
        if (!this.pending[keyString]) {
          this.pending[keyString] = this.openmct.objects
            .get(identifier)
            .then((retrievedDomainObject) => {
              this.datasets[keyString] = new Dataset(retrievedDomainObject);
              delete this.pending[keyString];

              this.#observe(retrievedDomainObject);

              return this.datasets[keyString].load();
            });
        }

        return this.pending[keyString];
      }
    }

    return this.datasets[keyString].load();
  }

  async getDomainObjects() {
    const keys = Object.keys(this.datasets);
    const domainObjectPromises = keys.map((key) => this.openmct.objects.get(key));

    const domainObjects = await Promise.all(domainObjectPromises);

    return domainObjects;
  }

  #scheduleReload() {
    this.reloading = true;

    let stabilityChecks = 0;
    let checkCount = 5;
    const message =
      'Open MCT for MCWS will reload to apply the changes you have made to the Dataset. Please wait.';
    const notification = this.openmct.notifications.progress(message, stabilityChecks);

    setInterval(() => {
      if (stabilityChecks <= checkCount) {
        if (mcwsClient.pending === 0) {
          notification.progress((++stabilityChecks / checkCount) * 100);
        }
      } else {
        window.location.reload();
      }
    }, 500);
  }

  #observe(datasetDomainObject) {
    this.openmct.objects.observe(datasetDomainObject, '*', (object, path, value) => {
      if (!this.reloading && path !== undefined) {
        this.#scheduleReload();
      }
    });
  }
}

let datasetCacheInstance = null;

export default function (openmct) {
  if (!datasetCacheInstance) {
    datasetCacheInstance = new DatasetCache(openmct);
  }

  return datasetCacheInstance;
}
