import { createIdentifierFromNamespaceDefinition, createNamespace } from './utils';
import existingNamespaceUpdateInterceptor from './existingNamespaceUpdateInterceptor';
import MCWSPersistenceProvider from './MCWSPersistenceProvider';
import MCWSUserPersistenceProvider from './MCWSUserPersistenceProvider';

export default function MCWSPersistenceProviderPlugin(configNamespaces) {
    return async function install(openmct) {
        let rootsResolve;
        const rootsPromise = new Promise((resolve, reject) => {
            rootsResolve = resolve;
        });
        openmct.objects.addRoot(() => rootsPromise);
        const namespaces = configNamespaces.map(createNamespace);
        const mcwsPersistenceProvider = new MCWSPersistenceProvider(openmct, namespaces);
        const mcwsUserPersistenceProvider = new MCWSUserPersistenceProvider(mcwsPersistenceProvider);

        const usersNamespace = namespaces.find((namespace) => namespace.containsNamespaces);

        // user namespaces are not required
        if (usersNamespace) {
            const checkOldNamespaces = localStorage.getItem(`r5.0_old_namespace_checked:${usersNamespace.key}`) === null;
            existingNamespaceUpdateInterceptor(openmct, usersNamespace, checkOldNamespaces);
        }

        // install the provider for each persistence space,
        // key is the namespace in the response for persistence namespaces
        const persistenceNamespaces = await mcwsPersistenceProvider.getPersistenceNamespaces();
        persistenceNamespaces.forEach((namespace) => {
            if (!namespace.containsNamespaces) {
                openmct.objects.addProvider(namespace.key, mcwsPersistenceProvider);
            } else {
                openmct.objects.addProvider('container', mcwsUserPersistenceProvider);
            }
        });

        // add the roots
        const rootNamespaces = await mcwsPersistenceProvider.getRootNamespaces();
        const ROOT_IDENTIFIERS = rootNamespaces.map(createIdentifierFromNamespaceDefinition);

        rootsResolve(ROOT_IDENTIFIERS);
    };
}
