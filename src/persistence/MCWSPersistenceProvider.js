import mcws from '../services/mcws/mcws';
import { createModelFromNamespaceDefinition, createIdentifierFromNamespaceDefinition } from './utils';

const USERNAME_FROM_PATH_REGEX = new RegExp('.*/(.*?)$');

/**
 * An object defining a MCWS namespace.  Provides a unique identifier for a
 * MCWS namespace and all the information necessary to access it.
 *
 * @typedef {Object} NamespaceDefinition
 * @property {Boolean} containsNamespaces true if this namespace has
 *     subnamespaces.
 * @property {string} id an persistence identifier for the namespace root.
 *     Should include a unique persistence space prefix.
 * @property {string} key the machine-readable presistence space identifier
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

export default class MCWSPersistenceProvider {   
    constructor(openmct, roots) {
        this.openmct = openmct;
        this.roots = roots;
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
            console.warn('MCWSPersistneceProvider:create', error);

            return false;
        }
    }

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
        
        // check if it is a namespace that has subnamespaces, if so, we return this item dynamically
        if (identifier.key === 'container') {
            const SKIP_IDENTIFIER = false;
            const persistenceNamespaces = await this.getPersistenceNamespaces();
            const containerNamespace = persistenceNamespaces.find((namespace) => namespace.key === identifier.namespace);
            const containedNamespaces = await this.getContainedNamespaces(containerNamespace);
            const containedNamespaceIdentifiers = containedNamespaces.map(createIdentifierFromNamespaceDefinition);

            return createModelFromNamespaceDefinition('system', containerNamespace, containedNamespaceIdentifiers);
        }

        const persistenceNamespace = await this.#getNamespace(namespace);

        try {
            let result = await persistenceNamespace.opaqueFile(key).read();

            result = await this.#fromPersistableModel(result, identifier);

            return result;
        } catch (error) {
            console.warn('MCWSPersistneceProvider:get', error);

            return;
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
            console.warn('MCWSPersistneceProvider:update', error);

            return;
        }
    }

    #toPersistableModel(domainObject) {
        //First make a copy so we are not mutating the provided model.
        const persistableModel = JSON.parse(JSON.stringify(domainObject));
        delete persistableModel.identifier;

        return persistableModel;
    }

    async #fromPersistableModel(result, identifier) {
        let domainObject = await result.json();

        domainObject.identifier = identifier;

        return domainObject;
    }

    async #getNamespace(persistenceSpace) {
        const persistenceNamespaces = await this.getPersistenceNamespaces();
        const persistenceNamespace = persistenceNamespaces.find((namespace) => {
            return namespace.key === persistenceSpace;
        })
        
        return mcws.namespace(persistenceNamespace.url);
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
        
        return Promise.resolve(this.persistenceNamespaces);
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
            return Promise.resolve([]);
        }

        const namespaceTemplate = structuredClone(namespaceDefinition.childTemplate);
        namespaceTemplate.location = namespaceDefinition.id;

        const user = await this.openmct.user.getCurrentUser();
        const containedNamespaces = await this.getNamespacesFromMCWS(namespaceDefinition);
        const userNamespace = this.interpolateUsername(namespaceTemplate, user.id);
        const existingUserNamespace = containedNamespaces.find(namespace => namespace.url === userNamespace.url);

        if (existingUserNamespace) {
            containedNamespaces.splice(containedNamespaces.indexOf(existingUserNamespace), 1);
            containedNamespaces.unshift(userNamespace);

            return containedNamespaces;
        }

        containedNamespaces.unshift(userNamespace);
        
        await this.createIfMissing(userNamespace, user.id, );

        return containedNamespaces;
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
        let rootNamespaces = await Promise.all(this.roots.map((rootNamespace) => this.createIfMissing(rootNamespace, user.id)));
        rootNamespaces = rootNamespaces.filter(Boolean);

        return this.filterNamespacesByPath(rootNamespaces);
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
        const containedNamespaces = await Promise.all(containingNamespaces.map(this.getContainedNamespaces.bind(this)));

        return containedNamespaces.flat();
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
        const namespaces = namespaceContents.filter(item => item.object === 'namespace');
        const templateObject = namespaceDefinition.childTemplate;
        const userNamespaces = namespaces.map((namespace) => {
            const username = USERNAME_FROM_PATH_REGEX.exec(namespace.subject)[1]
            const userNamespaceDefinition = this.interpolateUsername(templateObject, username);

            userNamespaceDefinition.location = namespaceDefinition.id;

            return userNamespaceDefinition;
        });

        return userNamespaces;
    };

    /**
     * Interpolate a username with all values in a supplied object, replacing
     * '${USER}' with the supplied username.
     *
     * @private
     * @param {NamespaceTemplate} templateObject namespace template object.
     * @param {string} username a username.
     * @returns {NamespaceDefinition} a namespace definition object.
     */
    interpolateUsername(templateObject, username) {
        const namespaceDefinition = {};

        Object.keys(templateObject).forEach(key => {
            namespaceDefinition[key] = templateObject[key].replace('${USER}', username);
        });
        
        return namespaceDefinition;
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
                namespaceDefinitions = namespaceDefinitions
                    .filter(definition => definition.key.startsWith(includeTerm));
            }
        });

        return namespaceDefinitions;
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
                        const model = createModelFromNamespaceDefinition(userId, namespaceDefinition);
                        await this.create(model);
                    }

                    return namespaceDefinition;
                } catch (createError) {
                    return;
                }
                    
            }
        }

        return;
    }

    // /**
    //  * Delete an object in the specified persistence space.
    //  * @param {string} space the space from which to delete this
    //  *        object
    //  * @param {string} key the identifier of the persisted object
    //  * @param {object} value a JSONifiable object that should be
    //  *        deleted
    //  * @returns {Promise.<boolean>} a promise for an indication
    //  *          of the success (true) or failure (false) of this
    //  *          operation
    //  */
    // deleteObject(space, key, value) {
    //     return this.#getNamespace(space)
    //         .then(function (namespace) {
    //             return namespace.opaqueFile(key)
    //                 .remove()
    //                 .then(
    //                     function () {
    //                         return true;
    //                     },
    //                     function () {
    //                         return false;
    //                     }
    //                 );
    //         });
    // }

    // /**
    //  * List all persistence spaces which this provider
    //  * recognizes.
    //  *
    //  * @returns {Promise.<string[]>} a promise for a list of
    //  *          spaces supported by this provider
    //  */
    // async listSpaces() {
    //     const namespaces = await this.namespaceService.getPersistenceNamespaces();

    //     return namespaces.map(space => space.key);
    // }

    // /**
    //  * List all objects (by their identifiers) that are stored
    //  * in the given persistence space, per this provider.
    //  * @param {string} space the space to check
    //  * @returns {Promise.<string[]>} a promise for the list of
    //  *          identifiers
    //  */
    // listObjects(space) {
    //     return this.#getNamespace(space)
    //         .then(function (namespace) {
    //             return namespace.read()
    //                 .then(listKeys, function () {
    //                     return undefined;
    //                 });
    //         });
    // }

    // // Support pulling a list of named opaque files from a namespace;
    // // these are returned from MCWS as an array of objects, each
    // // containing a Subject/Predicate/Object triple.
    // #isOpaqueFile(triple) {
    //     return triple &&
    //             typeof triple.Subject === 'string' &&
    //             triple.Predicate === 'has MIO type' &&
    //             triple.Object === 'opaque_file';
    // }

    // #getKey(triple) {
    //     // Strip out the namespace portion (first-to-last slash)
    //     return triple.Subject.replace(/^\S*\//, "");
    // }

    // #listKeys(triples) {
    //     return (triples || []).filter(isOpaqueFile).map(getKey);
    // }
}
