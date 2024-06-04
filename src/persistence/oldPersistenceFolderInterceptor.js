import {
  createModelFromNamespaceDefinition,
  interpolateUsername
} from './utils';

export default async function oldPersistenceFolderInterceptor(openmct, namespaces, ROOT_IDENTIFIERS) {
    let usersNamespace = namespaces.find((namespace) => namespace.containsNamespaces);
    usersNamespace = structuredClone(usersNamespace);

    const userTemplate = usersNamespace.childTemplate.key.split('$')[0];
    const userKeyCheck = new RegExp(`^${userTemplate}([^:]+)$`);

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
            const isUserFolderIdentifier = userKeyCheck.test(identifier.namespace) && identifier.key !== 'root';

            let userId;
            let namespaceDefinition;
            
            if (isUserFolderIdentifier) {
                userId = identifier.namespace.match(userKeyCheck)[1];
                namespaceDefinition = interpolateUsername(usersNamespace.childTemplate, userId);
                namespaceDefinition.location = usersNamespace.id;
            } else {
                userId = 'system';
                namespaceDefinition = namespaces.find(namespace => namespace.key === identifier.namespace);
            }

            const model = createModelFromNamespaceDefinition(userId, namespaceDefinition);
            
            openmct.objects.save(model);
            
            return model;
        }
    });
}
