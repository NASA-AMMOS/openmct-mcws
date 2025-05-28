import mcws from '../services/mcws/mcws';
import { createModelFromNamespaceDefinitionWithPersisted, interpolateUsername } from './utils';

const USERNAME_FROM_PATH_REGEX = new RegExp('.*/(.*?)$');

/**
 * An object defining a MCWS namespace.  Provides a unique identifier for a
 * MCWS namespace and all the information necessary to access it.
 *
 * @typedef {Object} NamespaceDefinition
 * @property {Boolean} containsNamespaces true if this namespace has
 *     sub-namespaces.
 * @property {string} id an persistence identifier for the namespace root.
 *     Should include a unique persistence space prefix.
 * @property {string} key the machine-readable persistence space identifier
 *     for this namespace.
 * @property {string} name the human readable name of the namespace.
 * @property {string} url the url to the MCWS namespace.
 * @property {NamespaceTemplate} childTemplate template for contained
 *     namespaces, required if `containsNamespaces` is  true.
 */

/**
 * An object defining a user root namespace.  Allows fetching of child
 * namespaces and defines format for creating new user namespaces.
 *
 * @typedef {Object} NamespaceTemplate
 * @param {String} id id template string for child namespaces.
 * @param {String} key key template string for child namespaces.
 * @param {String} name name template string for child namespaces.
 * @param {String} url url template string for child namespaces.
 */

/**
 * Provides persistence for objects (e.g. domainObject models)
 * utilizing MCWS namespaces.
 *
 * @param { module:openmct } openmct
 * @param { Array.<module:openmct.ObjectAPI~Identifier> } roots
 */

export default class BaseMCWSPersistenceProvider {
  constructor(openmct, roots) {
    this.openmct = openmct;
    this.roots = roots;
  }

  // Abstract method for get, to be implemented by subclasses
  async get(identifier, abortSignal) {
    throw new Error('Method not implemented');
  }

  /**
   * Return any namespace utilized by persistence.  This includes all root
   * namespaces and any namespaces they contain.
   *
   * @returns {Promise.<NamespaceDefinition[]>} persistenceNamespaces
   */
  async getPersistenceNamespaces() {
    // get root namespaces, get contained namespaces.
    if (!this.persistenceNamespaces) {
      const rootNamespaces = await this.getRootNamespaces();
      const allContainedNamespaces = await this.getAllContainedNamespaces(rootNamespaces);

      this.persistenceNamespaces = [...rootNamespaces, ...allContainedNamespaces];
    }

    return this.persistenceNamespaces;
  }

  /**
   * Return all namespaces contained in a given array of namespaces.
   *
   * @private
   * @param {NamespaceDefinition[]} namespaceDefinitions
   * @returns {Promise.<NamespaceDefinition[]>}
   *     containedNamespaceDefinitions an array of all contained namespaces.
   */
  async getAllContainedNamespaces(namespaceDefinitions) {
    const containingNamespaces = namespaceDefinitions.filter((definition) => {
      return definition.containsNamespaces === true;
    });
    const containedNamespaces = await Promise.all(
      containingNamespaces.map(this.getContainedNamespaces.bind(this))
    );

    return containedNamespaces.flat();
  }

  /**
   * Returns namespace definitions for all namespaces contained in a given
   * namespace.  Additionally, creates a contained namespace for the current
   * user if one does not already exist.
   *
   * @param {NamespaceDefinition} namespaceDefinition.
   * @returns {NamespaceDefinition[]} containedNamespaces.
   */
  async getContainedNamespaces(namespaceDefinition) {
    if (!namespaceDefinition?.containsNamespaces) {
      return [];
    }

    const namespaceTemplate = structuredClone(namespaceDefinition.childTemplate);
    namespaceTemplate.location = namespaceDefinition.id;

    const user = await this.openmct.user.getCurrentUser();
    const containedNamespaces = await this.getNamespacesFromMCWS(namespaceDefinition);
    const userNamespace = interpolateUsername(namespaceTemplate, user.id);
    const existingUserNamespace = containedNamespaces.find(
      (namespace) => namespace.url === userNamespace.url
    );

    if (existingUserNamespace) {
      containedNamespaces.splice(containedNamespaces.indexOf(existingUserNamespace), 1);
      containedNamespaces.unshift(userNamespace);

      return containedNamespaces;
    }

    containedNamespaces.unshift(userNamespace);

    await this.createIfMissing(userNamespace, user.id);

    return containedNamespaces;
  }

  /**
   * Read a namespace from MCWS and translate contained namespace objects into
   *  namespace definitions.
   *
   * @private
   * @param {NamespaceDefinition} namespaceDefinition namespace to read
   * @returns {Promise.<NamespaceDefinition[]>} containedNamespaceDefinitions
   */
  async getNamespacesFromMCWS(namespaceDefinition) {
    const namespaceContents = await mcws.namespace(namespaceDefinition.url).read();
    const namespaces = namespaceContents.filter((item) => item.object === 'namespace');
    const templateObject = namespaceDefinition.childTemplate;
    const userNamespaces = namespaces.map((namespace) => {
      const username = USERNAME_FROM_PATH_REGEX.exec(namespace.subject)[1];
      const userNamespaceDefinition = interpolateUsername(templateObject, username);

      userNamespaceDefinition.location = namespaceDefinition.id;

      return userNamespaceDefinition;
    });

    return userNamespaces;
  }

  /**
   * Get namespace definitions by taking defined roots and substituting user
   * fields.  Creates namespaces for definitions that are missing, and returns
   * a promise for an array of namespace definitions.
   *
   * @returns {Promise.<NamespaceDefinition[]>}
   */
  async getRootNamespaces() {
    const user = await this.openmct.user.getCurrentUser();
    let rootNamespaces = await Promise.all(
      this.roots.map((rootNamespace) => this.createIfMissing(rootNamespace, user.id))
    );
    rootNamespaces = rootNamespaces.filter(Boolean);

    return this.filterNamespacesByPath(rootNamespaces);
  }

  /**
   * Check if a namespace exists, and if it does not exist, create it.
   * Returns a promise that is resolved with the namespaceDefinition.
   * If there is an error accessing or creating the namespace, the promise is
   * resolved with `undefined`.
   *
   * @private
   * @param {NamespaceDefinition} namespaceDefinition
   * @returns {Promise.<NamespaceDefinition>|Promise.<undefined>}
   */
  async createIfMissing(namespaceDefinition, userId) {
    const namespace = mcws.namespace(namespaceDefinition.url);

    try {
      await namespace.read();

      return namespaceDefinition;
    } catch (readError) {
      if (readError.status === 404) {
        try {
          await namespace.create();

          if (!namespaceDefinition.id.endsWith('container')) {
            const model = createModelFromNamespaceDefinitionWithPersisted(
              userId,
              namespaceDefinition,
              []
            );
            await this.create(model);
          }

          return namespaceDefinition;
        } catch (e) {
          console.error('Error creating namespace:', e);

          return;
        }
      } else {
        throw readError;
      }
    }

    return;
  }

  /**
   * Filters a list of namespaces, returning only the namespaces that are
   * valid for a given path.
   *
   * @private
   * @param {NamespaceDefinition[]} namespaceDefinitions
   * @returns {NamespaceDefinition[]} validNamespaces
   */
  filterNamespacesByPath(namespaceDefinitions) {
    const FILTER_CRITERIA = {
      '/mcws/clients/vista-ammos': 'ammos',
      '/mcws/clients/vista-msl': 'msl',
      '/mcws/clients/vista-smap': 'smap'
    };

    Object.entries(FILTER_CRITERIA).forEach(([path, includeTerm]) => {
      if (window.location.pathname.startsWith(path)) {
        namespaceDefinitions = namespaceDefinitions.filter((definition) =>
          definition.key.startsWith(includeTerm)
        );
      }
    });

    return namespaceDefinitions;
  }
}
