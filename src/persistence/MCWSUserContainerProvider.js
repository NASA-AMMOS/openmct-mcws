import BaseMCWSPersistenceProvider from './BaseMCWSPersistenceProvider';
import {
  createIdentifierFromNamespaceDefinition,
  createModelFromNamespaceDefinitionWithPersisted
} from './utils';

export default class MCWSUserContainerProvider extends BaseMCWSPersistenceProvider {
  /**
   * Create and return a dynamically created parent user folder
   *
   * @param module:openmct.ObjectAPI~Identifier identifier An object identifier
   * @returns {Promise.<object>} a promise for the dynamically created parent user folder
   */
  async get(identifier) {
    const persistenceNamespaces = await this.getPersistenceNamespaces();
    const containerNamespace = persistenceNamespaces.find(
      (namespace) => namespace.key === identifier.namespace
    );
    const containedNamespaces = await this.getContainedNamespaces(containerNamespace);
    const containedNamespaceIdentifiers = containedNamespaces.map(
      createIdentifierFromNamespaceDefinition
    );

    return createModelFromNamespaceDefinitionWithPersisted(
      'system',
      containerNamespace,
      containedNamespaceIdentifiers
    );
  }
}
