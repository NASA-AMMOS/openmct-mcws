import { createIdentifierFromNamespaceDefinition, createNamespace } from './utils';
import MCWSPersistenceProvider from './MCWSPersistenceProvider';

export default function MCWSPersistenceProviderPlugin(configNamespaces) {
    return async function install(openmct) {
        let rootsResolve;
        const rootsPromise = new Promise((resolve, reject) => {
            rootsResolve = resolve;
        });
        openmct.objects.addRoot(() => rootsPromise);

        const mcwsPersistenceProvider = new MCWSPersistenceProvider(openmct, configNamespaces.map(createNamespace));

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
