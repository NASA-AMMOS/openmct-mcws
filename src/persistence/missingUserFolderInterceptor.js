import {
  createModelFromNamespaceDefinition,
  interpolateUsername
} from './utils';

export default async function missingUserFolderInterceptor(openmct, usersNamespace, ROOT_IDENTIFIERS) {
    const userTemplate = usersNamespace.childTemplate.key.split('$')[0];
    const userKeyCheck = new RegExp(`^${userTemplate}([^:]+)$`);
    openmct.objects.addGetInterceptor({
        appliesTo: (identifier, domainObject) => {
            // is missing, is not a root, matches a user namespace format
            return !domainObject
                && !ROOT_IDENTIFIERS.find(rootId => openmct.objects.areIdsEqual(rootId, identifier))
                && userKeyCheck.test(identifier.namespace);
        },
        invoke: (identifier, object) => {
            const userId = identifier.namespace.match(userKeyCheck)[1];
            const userNamespaceDefinition = interpolateUsername(usersNamespace.childTemplate, userId);
            userNamespaceDefinition.location = usersNamespace.id;
            const model = createModelFromNamespaceDefinition(userId, userNamespaceDefinition);
            
            openmct.objects.save(model);
            
            return model;
        }
    });
}
