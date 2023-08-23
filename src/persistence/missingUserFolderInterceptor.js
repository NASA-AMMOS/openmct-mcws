import {
  createModelFromNamespaceDefinition,
  interpolateUsername
} from './utils';

export default function missingUserFolderInterceptor(openmct, usersNamespace) {
    const userTemplate = usersNamespace.childTemplate.key.split('$')[0];
    const userKeyCheck = new RegExp(`^${userTemplate}([^:]+)$`);

    openmct.objects.addGetInterceptor({
        appliesTo: (identifier, domainObject) => {
            return !domainObject && userKeyCheck.test(identifier.namespace);
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
