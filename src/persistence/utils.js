export function createIdentifierFromNamespaceDefinition(namespaceDefinition) {
    return {
        key: namespaceDefinition.containsNamespaces ? 'container' : 'root',
        namespace: namespaceDefinition.key
    };
}

export function createModelFromNamespaceDefinition(userId, namespaceDefinition, composition = []) {
    const model = {
        identifier: createIdentifierFromNamespaceDefinition(namespaceDefinition),
        name: namespaceDefinition.name,
        createdBy: userId,
        created: Date.now(),
        persisted: Date.now(),
        type: 'folder',
        composition,
        location: namespaceDefinition.location || 'ROOT'
    };

    return model;
}

export function createNamespace(namespace) {
    if (namespace.userNamespace) {
        return {
            id: namespace.key + '-users:container',
            key: namespace.key + '-users',
            name: namespace?.name || namespace.key.toUpperCase() + ' Users',
            url: namespace.url,
            containsNamespaces: true,
            childTemplate: {
                id: namespace.key + '-${USER}:root',
                key: namespace.key + '-${USER}',
                name: '${USER}',
                url: namespace.url + '/${USER}'
            }
        };
    } else {
        return {
            id: namespace.key + '-shared:root',
            key: namespace.key + '-shared',
            name: namespace?.name || namespace.key.toUpperCase() + ' Shared',
            url: namespace.url
        };
    }
}
