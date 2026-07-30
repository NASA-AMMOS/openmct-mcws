import { createIdentifierFromNamespaceDefinition, createNamespace } from './utils.js';
import { USER_NAMESPACE_SUFFIX } from './constants.js';
import existingNamespaceUpdateInterceptor from './existingNamespaceUpdateInterceptor.js';
import MCWSPersistenceProvider from './MCWSPersistenceProvider.js';
import MCWSUserContainerProvider from './MCWSUserContainerProvider.js';
import oldPersistenceFolderInterceptor from './oldPersistenceFolderInterceptor.js';

export default function MCWSPersistenceProviderPlugin(configNamespaces) {
  return function install(openmct) {
    let rootsResolve;
    const rootsPromise = new Promise((resolve, reject) => {
      rootsResolve = resolve;
    });

    openmct.objects.addRoot(() => rootsPromise);

    const namespaces = configNamespaces.map(createNamespace);
    // the namespace keys that will apply for this main persistence provider's namespace
    const persistenceNamespaceKeys = configNamespaces
      .filter((namespace) => !namespace.userNamespace)
      .map((namespace) => namespace.key + '-');
    // the namespace keys that will apply for this user folder provider's namespace
    // will also be used to negative match for the main persistence provider's namespace
    const userFolderNamespaceKeys = configNamespaces
      .filter((namespace) => namespace.userNamespace)
      .map((namespace) => namespace.key + USER_NAMESPACE_SUFFIX);
    const mcwsPersistenceProvider = new MCWSPersistenceProvider(
      openmct,
      namespaces,
      persistenceNamespaceKeys,
      userFolderNamespaceKeys
    );
    const mcwsUserContainerProvider = new MCWSUserContainerProvider(
      openmct,
      namespaces,
      userFolderNamespaceKeys
    );

    openmct.objects.addProvider(mcwsPersistenceProvider);
    openmct.objects.addProvider(mcwsUserContainerProvider);

    // add the roots
    mcwsPersistenceProvider.getRootNamespaces().then((rootNamespaces) => {
      const ROOT_IDENTIFIERS = rootNamespaces.map(createIdentifierFromNamespaceDefinition);
      // user namespaces are not required
      let usersNamespace = namespaces.find((namespace) => namespace.containsNamespaces);
      const checkOldNamespaces = usersNamespace
        ? localStorage.getItem(`r5.0_old_namespace_checked:${usersNamespace.key}`) === null
        : false;
      existingNamespaceUpdateInterceptor(openmct, usersNamespace, checkOldNamespaces);
      oldPersistenceFolderInterceptor(openmct, namespaces, ROOT_IDENTIFIERS);

      rootsResolve(ROOT_IDENTIFIERS);
    });
  };
}
