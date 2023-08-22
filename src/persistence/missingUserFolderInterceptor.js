import { createModelFromNamespaceDefinition, interpolateUsername } from './utils';

export default function missingUserFolderInterceptor(openmct, usersNamespace) {
    const userTemplate = usersNamespace.childTemplate.key.split('$')[0];
    const userKeyCheck = new RegExp(`^${userTemplate}[^:]+$`);

    openmct.objects.addGetInterceptor({
        appliesTo: (identifier, domainObject) => {
            return !domainObject && userKeyCheck.test(identifier.key);
        },
        invoke: (identifier, object) => {
            const userId = identifier.key.match(pattern)[1];
            const model = createModelFromNamespaceDefinition(userId, namespaceDefinition);
            
            return object;
        }
    });
}
