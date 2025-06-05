import BaseMCWSPersistenceProvider from './BaseMCWSPersistenceProvider';
import mcws from '../services/mcws/mcws';

export default class MCWSPersistenceProvider extends BaseMCWSPersistenceProvider {
  /**
   * Read an existing object back from persistence.
   * @param module:openmct.ObjectAPI~Identifier identifier An object identifier
   * @param {AbortSignal} abortSignal (optional) signal to abort fetch requests
   * @returns {Promise.<object>} a promise for the stored
   *          object; this will resolve to undefined if no such
   *          object is found.
   */
  async get(identifier, abortSignal) {
    const { key, namespace } = identifier;
    const options = {};

    if (abortSignal) {
      options.signal = abortSignal;
    }

    try {
      const persistenceNamespace = await this.#getNamespace(namespace, options);
      let result = await persistenceNamespace.opaqueFile(key).read();

      result = await this.#fromPersistableModel(result, identifier);

      return result;
    } catch (error) {
      console.warn('MCWSPersistenceProvider:get', error);

      // it's a network error, we don't want to create a new object
      if (error.status !== 404) {
        this.openmct.notifications.error(
          `Error: ${error.message ?? 'Unknown error'}. Check network connection and try again.`
        );

        return {
          identifier,
          type: 'unknown',
          name: 'Error: ' + this.openmct.objects.makeKeyString(identifier)
        };
      }

      return;
    }
  }

  /**
   * Create a new object in the specified persistence space.
   * @param {module:openmct.DomainObject} domainObject the domain object to
   *        save
   * @returns {Promise.<boolean>} a promise for an indication
   *          of the success (true) or failure (false) of this
   *          operation
   */
  async create(domainObject) {
    const { key, namespace } = domainObject.identifier;
    const persistenceNamespace = await this.#getNamespace(namespace);
    const model = this.#toPersistableModel(domainObject);

    try {
      await persistenceNamespace.opaqueFile(key).create(model);

      return true;
    } catch (error) {
      console.warn('MCWSPersistenceProvider:create', error);

      return false;
    }
  }

  /**
   * Update an existing object in the specified persistence space.
   * @param {module:openmct.DomainObject} domainObject the domain object to
   *        update
   * @returns {Promise.<boolean>} a promise for an indication
   *          of the success (true) or failure (false) of this
   *          operation
   */
  async update(domainObject) {
    const { key, namespace } = domainObject.identifier;
    const persistenceNamespace = await this.#getNamespace(namespace);
    const model = this.#toPersistableModel(domainObject);

    try {
      const result = await persistenceNamespace.opaqueFile(key).replace(model);

      return result;
    } catch (error) {
      console.warn('MCWSPersistenceProvider:update', error);

      return false;
    }
  }

  /**
   * Converts a domain object to a persistable model by removing the identifier.
   * @private
   * @param {module:openmct.DomainObject} domainObject - The domain object to convert.
   * @returns {Object} The persistable model.
   */
  #toPersistableModel(domainObject) {
    //First make a copy so we are not mutating the provided model.
    const persistableModel = JSON.parse(JSON.stringify(domainObject));
    delete persistableModel.identifier;

    return persistableModel;
  }

  /**
   * Converts a persisted result back into a domain object.
   * @private
   * @param {Object} result - The result from persistence.
   * @param {module:openmct.ObjectAPI~Identifier} identifier - The identifier for the domain object.
   * @returns {Promise<module:openmct.DomainObject>} A promise that resolves to the domain object.
   */
  async #fromPersistableModel(result, identifier) {
    let domainObject = await result.json();

    domainObject.identifier = identifier;

    return domainObject;
  }

  /**
   * Retrieves the MCWS namespace for a given persistence space.
   * @private
   * @param {string} persistenceSpace - The key of the persistence space.
   * @param {Object} [options] - Additional options for the namespace.
   * @returns {Promise<Object>} A promise that resolves to the MCWS namespace.
   */
  async #getNamespace(persistenceSpace, options) {
    const persistenceNamespaces = await this.getPersistenceNamespaces();
    const persistenceNamespace = persistenceNamespaces.find((namespace) => {
      return namespace.key === persistenceSpace;
    });

    return mcws.namespace(persistenceNamespace.url, options);
  }
}
