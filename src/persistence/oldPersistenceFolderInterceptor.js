import { createModelFromNamespaceDefinition, interpolateUsername } from './utils';

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
      const isUserFolderIdentifier = isUserNamespace(usersNamespace, userKeyRegex, identifier);
      const nonUserRoots = ROOT_IDENTIFIERS.filter((rootId) => rootId.key !== 'container');
      const isRootFolder = nonUserRoots.some((rootId) =>
        openmct.objects.areIdsEqual(rootId, identifier)
      );

      // we will create domain objects for empty older persistence user or
      // root (ex: shared) folders, not for the user root or other folders
      return isMissing && isNotUserRoot && (isUserFolderIdentifier || isRootFolder);
    },
    invoke: (identifier, object) => {
      let userId = 'system';
      let namespaceDefinition;

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
