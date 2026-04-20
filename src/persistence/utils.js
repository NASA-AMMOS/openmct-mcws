import {
  USER_NAMESPACE_SUFFIX,
  SHARED_NAMESPACE_SUFFIX,
  USER_CONTAINER_ID_SUFFIX,
  ROOT_NAMESPACE_SUFFIX
} from './constants.js';

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

export function createModelFromNamespaceDefinitionWithPersisted(
  userId,
  namespaceDefinition,
  composition = []
) {
  const model = createModelFromNamespaceDefinition(userId, namespaceDefinition, composition);

  model.persisted = Date.now();

  return model;
}

export function createNamespace(namespace) {
  if (namespace.userNamespace) {
    return {
      id: `${namespace.key}${USER_NAMESPACE_SUFFIX}${USER_CONTAINER_ID_SUFFIX}`,
      key: `${namespace.key}${USER_NAMESPACE_SUFFIX}`,
      name: namespace?.name || namespace.key.toUpperCase() + ' Users',
      url: namespace.url,
      containsNamespaces: true,
      childTemplate: {
        id: namespace.key + '-${USER}' + ROOT_NAMESPACE_SUFFIX,
        key: namespace.key + '-${USER}',
        name: '${USER}',
        url: namespace.url + '/${USER}'
      }
    };
  } else {
    return {
      id: `${namespace.key}${SHARED_NAMESPACE_SUFFIX}${ROOT_NAMESPACE_SUFFIX}`,
      key: `${namespace.key}${SHARED_NAMESPACE_SUFFIX}`,
      name: namespace?.name || namespace.key.toUpperCase() + ' Shared',
      url: namespace.url
    };
  }
}

/**
 * Interpolate a username with all values in a supplied object, replacing
 * '${USER}' with the supplied username.
 *
 * @private
 * @param {NamespaceTemplate} templateObject namespace template object.
 * @param {string} username a username.
 * @returns {NamespaceDefinition} a namespace definition object.
 */
export function interpolateUsername(templateObject, username) {
  const namespaceDefinition = {};

  Object.keys(templateObject).forEach((key) => {
    namespaceDefinition[key] = templateObject[key].replace('${USER}', username);
  });

  return namespaceDefinition;
}
