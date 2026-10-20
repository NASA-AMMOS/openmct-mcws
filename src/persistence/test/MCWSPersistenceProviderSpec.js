import MCWSPersistenceProvider from '../MCWSPersistenceProvider.js';
import mcws from 'services/mcws/mcws.js';

describe('The MCWS Persistence Provider', () => {
  let mockNamespaceService;
  let persistenceNamespaces;
  let mockNamespace;
  let mockOpaqueFile;
  let openmct;
  let mcwsPersistenceProvider;

  beforeEach(() => {
    openmct = {
      user: {
        getCurrentUser: () => Promise.resolve({ id: 'myUser' })
      }
    };

    spyOn(mcws, 'namespace');
    mockNamespaceService = jasmine.createSpyObj('namespaceService', ['getPersistenceNamespaces']);

    persistenceNamespaces = [
      {
        key: 'testSpace',
        url: '/test/namespace'
      },
      {
        key: 'testSpace2',
        url: '/test/namespace2'
      }
    ];

    mockNamespaceService.getPersistenceNamespaces.and.returnValue(
      Promise.resolve(persistenceNamespaces)
    );

    mockNamespace = jasmine.createSpyObj('namespace', ['opaqueFile', 'read']);
    mockOpaqueFile = jasmine.createSpyObj('opaqueFile', ['read', 'replace', 'remove', 'create']);

    mcws.namespace.and.returnValue(mockNamespace);
    mockNamespace.opaqueFile.and.returnValue(mockOpaqueFile);

    mcwsPersistenceProvider = new MCWSPersistenceProvider(openmct, persistenceNamespaces);
  });

  it('provides a promise for available namespaces', async () => {
    const spaces = await mcwsPersistenceProvider.getPersistenceNamespaces();
    expect(spaces).toEqual(persistenceNamespaces);
  });

  // DO WE DELETE THIS TEST? I don't think we use this functionality anymore.
  xit('provides a listing of namespaces when provided a namespace definition', async () => {
    const namespaceTriples = [
      {
        Subject: '/test/namespace/a',
        Predicate: 'has MIO type',
        Object: 'opaque_file'
      },
      {
        Subject: '/test/namespace/b',
        Predicate: 'has MIO type',
        Object: 'namespace'
      },
      {
        Subject: '/test/namespace/c',
        Predicate: 'something else',
        Object: 'opaque_file'
      },
      {
        Subject: '/some/namespace/xyz',
        Predicate: 'has MIO type',
        Object: 'opaque_file'
      },
      {
        Subject: '/some/namespace/123-ABC',
        Predicate: 'has MIO type',
        Object: 'opaque_file'
      }
    ];
    mockNamespace.read.and.returnValue(Promise.resolve(namespaceTriples));

    const objects = await mcwsPersistenceProvider.getNamespacesFromMCWS({ url: '/test/namespace' });
    expect(objects).toEqual(namespaceTriples);
  });

  it('allows objects to be created', async () => {
    mockOpaqueFile.create.and.returnValue(Promise.resolve(true));
    const domainObject = {
      identifier: {
        key: 'testKey',
        namespace: 'testSpace'
      },
      someKey: 'some value'
    };
    const result = await mcwsPersistenceProvider.create(domainObject);

    expect(result).toBe(true);
    expect(mockNamespace.opaqueFile).toHaveBeenCalledWith('testKey');
    expect(mockOpaqueFile.create).toHaveBeenCalledWith({ someKey: 'some value' });
  });

  it('allows objects to be read', async () => {
    const identifier = {
      key: 'testKey',
      namespace: 'testSpace'
    };
    const model = {
      someKey: 'some value'
    };
    const domainObject = {
      identifier,
      ...model
    };
    mockOpaqueFile.read.and.returnValue(Promise.resolve({ json: () => Promise.resolve(model) }));
    const object = await mcwsPersistenceProvider.get(identifier);

    expect(object).toEqual(domainObject);
    expect(mcws.namespace).toHaveBeenCalledWith('/test/namespace');
    expect(mockNamespace.opaqueFile).toHaveBeenCalledWith('testKey');
    expect(mockOpaqueFile.read).toHaveBeenCalled();
  });

  it('allows objects to be updated', async () => {
    mockOpaqueFile.replace.and.returnValue(Promise.resolve(true));
    const domainObject = {
      identifier: {
        key: 'testKey',
        namespace: 'testSpace'
      },
      someKey: 'some value'
    };
    const result = await mcwsPersistenceProvider.update(domainObject);

    expect(result).toBe(true);
    expect(mcws.namespace).toHaveBeenCalledWith('/test/namespace');
    expect(mockNamespace.opaqueFile).toHaveBeenCalledWith('testKey');
    expect(mockOpaqueFile.replace).toHaveBeenCalledWith({ someKey: 'some value' });
  });

  // We don't allow delete in the core API, so we don't need this test.
  xit('allows objects to be deleted', async () => {
    mockOpaqueFile.remove.and.returnValue(Promise.resolve(true));
    await mcwsPersistenceProvider.delete({ key: 'testKey', namespace: 'testSpace' });

    expect(mcws.namespace).toHaveBeenCalledWith('/test/namespace');
    expect(mockNamespace.opaqueFile).toHaveBeenCalledWith('testKey');
    expect(mockOpaqueFile.remove).toHaveBeenCalled();
  });

  xit('converts rejected promises to promises resolves to undefined', async () => {
    mockOpaqueFile.read.and.returnValue(Promise.reject('hello'));
    const result = await mcwsPersistenceProvider.get({ key: 'testKey', namespace: 'testSpace' });

    expect(result).toBeUndefined();
  });

  describe('lazy user folder creation', () => {
    let namespaceMIOs;
    let userNamespaceMIO;
    let userOpaqueFile;
    let otherUserOpaqueFile;

    function makeOpaqueFile() {
      return jasmine.createSpyObj('opaqueFile', ['read', 'create', 'replace']);
    }

    function makeNamespace(url, readImpl, opaqueFile) {
      const namespace = jasmine.createSpyObj(`namespace:${url}`, ['read', 'create', 'opaqueFile']);
      namespace.read.and.callFake(readImpl);
      namespace.create.and.returnValue(Promise.resolve([]));
      namespace.opaqueFile.and.returnValue(opaqueFile);
      namespaceMIOs[url] = namespace;

      return namespace;
    }

    beforeEach(() => {
      namespaceMIOs = {};
      mcws.namespace.and.callFake((url) => namespaceMIOs[url]);

      userOpaqueFile = makeOpaqueFile();
      otherUserOpaqueFile = makeOpaqueFile();
      userOpaqueFile.read.and.callFake(() => Promise.reject({ status: 404 }));
      otherUserOpaqueFile.read.and.callFake(() => Promise.reject({ status: 404 }));
      userOpaqueFile.create.and.returnValue(Promise.resolve(true));

      makeNamespace('/test/shared', () => Promise.resolve([]), makeOpaqueFile());
      makeNamespace(
        '/test/users',
        () => Promise.resolve([{ object: 'namespace', subject: '/test/users/otherUser' }]),
        makeOpaqueFile()
      );
      userNamespaceMIO = makeNamespace(
        '/test/users/myUser',
        () => Promise.reject({ status: 404 }),
        userOpaqueFile
      );
      makeNamespace('/test/users/otherUser', () => Promise.resolve([]), otherUserOpaqueFile);

      openmct = {
        user: {
          getCurrentUser: () => Promise.resolve({ id: 'myUser', name: 'My User' })
        },
        notifications: { error: jasmine.createSpy('notificationsError') },
        objects: { makeKeyString: (id) => `${id.namespace}:${id.key}` }
      };

      mcwsPersistenceProvider = new MCWSPersistenceProvider(openmct, [
        { id: 'test-shared:root', key: 'test-shared', name: 'Test Shared', url: '/test/shared' },
        {
          id: 'test-users:container',
          key: 'test-users',
          name: 'Test Users',
          url: '/test/users',
          containsNamespaces: true,
          childTemplate: {
            id: 'test-${USERID}:root',
            key: 'test-${USERID}',
            name: '${USERNAME}',
            url: '/test/users/${USERID}'
          }
        }
      ]);
    });

    it('represents the current user folder without creating it', async () => {
      const folder = await mcwsPersistenceProvider.get({
        key: 'root',
        namespace: 'test-myUser'
      });

      expect(folder.identifier).toEqual({ key: 'root', namespace: 'test-myUser' });
      expect(folder.type).toBe('folder');
      expect(folder.name).toBe('My User');
      expect(folder.composition).toEqual([]);
      expect(folder.persisted).toBeUndefined();
      expect(userNamespaceMIO.create).not.toHaveBeenCalled();
    });

    it('does not represent another user folder that is missing', async () => {
      const folder = await mcwsPersistenceProvider.get({
        key: 'root',
        namespace: 'test-otherUser'
      });

      expect(folder).toBeUndefined();
    });

    it('creates the user folder when an object is first created in it', async () => {
      const result = await mcwsPersistenceProvider.create({
        identifier: { key: 'child1', namespace: 'test-myUser' },
        type: 'folder',
        name: 'Child',
        composition: []
      });

      expect(result).toBe(true);
      expect(userNamespaceMIO.create).toHaveBeenCalled();
      // root folder file first, then the child object
      expect(userOpaqueFile.create.calls.count()).toBe(2);
      expect(userOpaqueFile.create.calls.argsFor(0)[0].identifier).toEqual({
        key: 'root',
        namespace: 'test-myUser'
      });
      expect(userOpaqueFile.create.calls.argsFor(1)[0].name).toBe('Child');
    });

    it('does not represent a missing non-root object in the current user folder', async () => {
      const object = await mcwsPersistenceProvider.get({
        key: 'someChild',
        namespace: 'test-myUser'
      });

      expect(object).toBeUndefined();
      expect(userNamespaceMIO.create).not.toHaveBeenCalled();
    });

    it('rejects folder creation when the namespace read fails', async () => {
      userNamespaceMIO.read.and.callFake(() => Promise.reject({ status: 500 }));

      await expectAsync(
        mcwsPersistenceProvider.create({
          identifier: { key: 'root', namespace: 'test-myUser' },
          type: 'folder',
          name: 'My User',
          composition: []
        })
      ).toBeRejected();
      expect(userOpaqueFile.create).not.toHaveBeenCalled();
    });

    it('only creates the namespace when the folder root itself is created', async () => {
      const result = await mcwsPersistenceProvider.create({
        identifier: { key: 'root', namespace: 'test-myUser' },
        type: 'folder',
        name: 'My User',
        composition: []
      });

      expect(result).toBe(true);
      expect(userNamespaceMIO.create).toHaveBeenCalled();
      expect(userOpaqueFile.create.calls.count()).toBe(1);
    });
  });
});
