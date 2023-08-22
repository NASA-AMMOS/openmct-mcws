import { createModelFromNamespaceDefinition, interpolateUsername } from './utils';

export default function missingUserFolderInterceptor(openmct, usersNamespace) {
    const userTemplate = usersNamespace.childTemplate.key.split('$')[0];
    const userKeyCheck = new RegExp(`^${userTemplate}[^:]+$`);

    openmct.objects.addGetInterceptor({
        appliesTo: (identifier, domainObject) => {
            console.log('usersNamespace', usersNamespace);
            console.log(identifier, !domainObject && userKeyCheck.test(identifier.namespace));
            return !domainObject && userKeyCheck.test(identifier.namespace);
        },
        invoke: (identifier, object) => {
            const userId = identifier.namespace.match(pattern)[1];
            const userNamespaceDefinition = interpolateUsername(usersNamespace.childTemplate, userId);
            userNamespaceDefinition.location = userNamespaceDefinition.id;
            const model = createModelFromNamespaceDefinition(userId, userNamespaceDefinition);
            
            openmct.objects.save(model);
            
            return model;
        }
    });
}
