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
        type: 'folder',
        composition,
        location: namespaceDefinition.location || 'ROOT'
    };

    return model;
}

export function createModelFromNamespaceDefinitionWithPersisted(userId, namespaceDefinition, composition = []) {
    const model = createModelFromNamespaceDefinition(userId, namespaceDefinition, composition);

    model.persisted = Date.now();

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
                id: namespace.key + '-${USERID}:root',
                key: namespace.key + '-${USERID}',
                name: '${USERNAME}',
                url: namespace.url + '/${USERID}'
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

/**
 * Interpolate a username with all values in a supplied object, replacing
 * '${USERNAME}' with the supplied username and '${USERID} with the
 *  supplied user ID.
 *
 * @private
 * @param {NamespaceTemplate} templateObject namespace template object.
 * @param {string} userId the user ID
 * @param {string} username the username (default is userId)
 * @returns {NamespaceDefinition} a namespace definition object.
 */
export function interpolateUsername(templateObject, userId, username = userId) {
    const namespaceDefinition = {};

    Object.keys(templateObject).forEach(key => {
        namespaceDefinition[key] = templateObject[key].replace('${USERNAME}', username).replace('${USERID}', userId);
    });
    
    return namespaceDefinition;
}
