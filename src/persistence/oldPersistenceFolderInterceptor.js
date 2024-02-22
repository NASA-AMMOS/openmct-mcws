import {
  createModelFromNamespaceDefinition,
  interpolateUsername
} from './utils';

export default async function oldPersistenceFolderInterceptor(openmct, namespaces, ROOT_IDENTIFIERS) {
    const userTemplate = usersNamespace.childTemplate.key.split('$')[0];
    const userKeyCheck = new RegExp(`^${userTemplate}([^:]+)$`);
    let usersNamespace = namespaces.find((namespace) => namespace.containsNamespaces);
    usersNamespace = structuredClone(usersNamespace);

    openmct.objects.addGetInterceptor({
        appliesTo: (identifier, domainObject) => {
            const isMissing = !domainObject;
            const isNotUserRoot = identifier.key !== 'container';
            const isUserFolderIdentifier = userKeyCheck.test(identifier.namespace);
            const nonUserRoots = ROOT_IDENTIFIERS.filter(rootId => rootId.key !== 'container');
            const isRootFolder = nonUserRoots.find(rootId => openmct.objects.areIdsEqual(rootId, identifier)) !== undefined;

            // we will create domain objects for empty older persistence user or
            // root (ex: shared) folders, not for the user root or other folders
            return isMissing && isNotUserRoot && (isUserFolderIdentifier || isRootFolder);
        },
        invoke: (identifier, object) => {
            const isUserNamespace = identifier.key === 'container';

            const userId = identifier.namespace.match(userKeyCheck)[1];
            let namespaceDefinition;
            
            if (isUserNamespace) {
                namespaceDefinition = interpolateUsername(usersNamespace.childTemplate, userId);
                namespaceDefinition.location = usersNamespace.id;
            } else {
                namespaceDefinition = namespaces.find(namespace => namespace.namespace === identifier.key);
            }

            const model = createModelFromNamespaceDefinition(userId, namespaceDefinition);
            
            openmct.objects.save(model);
            
            return model;
        }
    });
}
