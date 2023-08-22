import { createIdentifierFromNamespaceDefinition, createNamespace } from './utils';
import existingNamespaceUpdateInterceptor from './existingNamespaceUpdateInterceptor';
import MCWSPersistenceProvider from './MCWSPersistenceProvider';
import missingUserFolderInterceptor from './missingUserFolderInterceptor';

export default function MCWSPersistenceProviderPlugin(configNamespaces) {
    return async function install(openmct) {
        let rootsResolve;
        const rootsPromise = new Promise((resolve, reject) => {
            rootsResolve = resolve;
        });
        openmct.objects.addRoot(() => rootsPromise);
        const namespaces = configNamespaces.map(createNamespace);
        const mcwsPersistenceProvider = new MCWSPersistenceProvider(openmct, namespaces);

        const usersNamespace = structuredClone(namespaces.find((namespace) => namespace.containsNamespaces));
        const checkOldNamespaces = localStorage.getItem(`r5.0_old_namespace_checked:${usersNamespace.key}`) === null;
        existingNamespaceUpdateInterceptor(openmct, usersNamespace, checkOldNamespaces);
        missingUserFolderInterceptor(openmct, usersNamespace);

        // install the provider for each persistence space,
        // key is the namespace in the response for persistence namespaces
        const persistenceNamespaces = await mcwsPersistenceProvider.getPersistenceNamespaces();
        persistenceNamespaces.forEach(({ key }) => openmct.objects.addProvider(key, mcwsPersistenceProvider));

        // add the roots
        const rootNamespaces = await mcwsPersistenceProvider.getRootNamespaces();
        const ROOT_IDENTIFIERS = rootNamespaces.map(createIdentifierFromNamespaceDefinition);

        rootsResolve(ROOT_IDENTIFIERS);
    };
}
