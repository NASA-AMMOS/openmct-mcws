import { createModelFromNamespaceDefinition, createIdentifierFromNamespaceDefinition } from './utils';

export default class MCWSUserPersistenceProvider {   
    constructor(persistenceProvider) {
        this.persistenceProvider = persistenceProvider;
    }

    /**
     * Handle user namespace requests, these are dynamically created.
     * @param module:openmct.ObjectAPI~Identifier identifier An object identifier
     * @returns {Promise.<object>} a promise for the stored
     *          object; this will resolve to undefined if no such
     *          object is found.
     */
    async get(identifier) { 
        const persistenceNamespaces = await this.persistenceProvider.getPersistenceNamespaces();
        const containerNamespace = persistenceNamespaces.find((namespace) => namespace.key === identifier.namespace);
        const containedNamespaces = await this.persistenceProvider.getContainedNamespaces(containerNamespace);
        const containedNamespaceIdentifiers = containedNamespaces.map(createIdentifierFromNamespaceDefinition);

        return createModelFromNamespaceDefinition('system', containerNamespace, containedNamespaceIdentifiers);
    }
}
