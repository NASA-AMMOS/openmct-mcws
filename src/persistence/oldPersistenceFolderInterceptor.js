import { createModelFromNamespaceDefinition, interpolateUsername } from './utils.js';

function isUserNamespace(namespace, userKeyRegex, identifier) {
  return namespace && userKeyRegex.test(identifier.namespace);
}

function findNamespaceDefinition(namespaces, identifier) {
  return namespaces.find((namespace) => namespace.key === identifier.namespace);
}

export default async function oldPersistenceFolderInterceptor(
  openmct,
  namespaces,
  ROOT_IDENTIFIERS
) {
  const usersNamespace = namespaces.find((namespace) => namespace.containsNamespaces);
  const userKeyRegex = usersNamespace
    ? new RegExp(`^${usersNamespace.childTemplate.key.split('$')[0]}([^:]+)$`)
    : null;

  openmct.objects.addGetInterceptor({
    appliesTo: (identifier, domainObject) => {
      const isMissing = !domainObject;
      const isNotUserRoot = identifier.key !== 'container';
      const nonUserRoots = ROOT_IDENTIFIERS.filter((rootId) => rootId.key !== 'container');
      const isRootFolder = nonUserRoots.some((rootId) =>
        openmct.objects.areIdsEqual(rootId, identifier)
      );

      // we will create domain objects for empty older persistence root
      // (ex: shared) folders, not for the user root or other folders.
      // User folders are excluded: they are virtual until first write,
      // and recreating one on read would defeat lazy folder creation.
      return isMissing && isNotUserRoot && isRootFolder;
    },
    invoke: (identifier, object) => {
      let userId = 'system';
      let namespaceDefinition;

      // if the object is a network error object, we don't want to create a new object
      if (object.networkError === true) {
        return object;
      }

      if (
        isUserNamespace(usersNamespace, userKeyRegex, identifier) &&
        !identifier.namespace.includes('shared')
      ) {
        userId = identifier.namespace.match(userKeyRegex)[1];

        namespaceDefinition = interpolateUsername(usersNamespace.childTemplate, userId);
        namespaceDefinition.location = usersNamespace.id;
      } else {
        namespaceDefinition = findNamespaceDefinition(namespaces, identifier) || { key: 'default' };
      }

      const model = createModelFromNamespaceDefinition(userId, namespaceDefinition);
      openmct.objects.save(model);

      return model;
    }
  });
}
