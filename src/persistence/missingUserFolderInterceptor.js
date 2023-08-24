import {
  createModelFromNamespaceDefinition,
  interpolateUsername
} from './utils';

export default function missingUserFolderInterceptor(openmct, usersNamespace, containedNamespaces) {
    const containedIds = containedNamespaces.map(createIdentifierFromNamespaceDefinition);

    openmct.objects.addGetInterceptor({
        appliesTo: (identifier, domainObject) => {
            return containedIds.find(id => openmct.objects.arIdsEqual(id, identifier));
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
