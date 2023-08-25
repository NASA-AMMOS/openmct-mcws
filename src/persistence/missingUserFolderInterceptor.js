import {
  createIdentifierFromNamespaceDefinition,
  createModelFromNamespaceDefinition,
  interpolateUsername
} from './utils';

export default async function missingUserFolderInterceptor(openmct, usersNamespace, containedNamespaces) {
    const containedIds = containedNamespaces.map(createIdentifierFromNamespaceDefinition);

    openmct.objects.addGetInterceptor({
        appliesTo: (identifier, domainObject) => {
            return !domainObject && containedIds.find(id => openmct.objects.areIdsEqual(id, identifier));
        },
        invoke: (identifier, object) => {
            const namspaceParts = identifier.namespace.split('-');
            const userId = namspaceParts[namspaceParts.length - 1];
            const userNamespaceDefinition = interpolateUsername(usersNamespace.childTemplate, userId);
            userNamespaceDefinition.location = usersNamespace.id;
            const model = createModelFromNamespaceDefinition(userId, userNamespaceDefinition);
            
            openmct.objects.save(model);
            
            return model;
        }
    });
}
