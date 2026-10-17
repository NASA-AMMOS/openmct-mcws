import oldPersistenceFolderInterceptor from '../oldPersistenceFolderInterceptor.js';
import { createNamespace, createIdentifierFromNamespaceDefinition } from '../utils.js';

describe('oldPersistenceFolderInterceptor', () => {
  let interceptor;
  let saveSpy;

  const namespaces = [
    createNamespace({ key: 'qr', name: 'QR Store', url: 'http://localhost:8091/qr/shared' }),
    createNamespace({
      key: 'qr',
      name: 'QR Users',
      url: 'http://localhost:8091/qr/users',
      userNamespace: true
    })
  ];
  const ROOT_IDENTIFIERS = namespaces.map(createIdentifierFromNamespaceDefinition);

  beforeEach(async () => {
    saveSpy = jasmine.createSpy('save');
    const openmct = {
      objects: {
        addGetInterceptor: (candidate) => {
          interceptor = candidate;
        },
        areIdsEqual: (a, b) => a.namespace === b.namespace && a.key === b.key,
        save: saveSpy
      }
    };

    await oldPersistenceFolderInterceptor(openmct, namespaces, ROOT_IDENTIFIERS);
  });

  it('ignores a mistyped shared id instead of recreating (and wiping) the root', () => {
    // qr-shared accidentally matches the qr-<userid> pattern; a failed read
    // for key "root}" (ex: from a corrupt location) must not trigger a
    // fresh root write to "root".
    const applies = interceptor.appliesTo({ namespace: 'qr-shared', key: 'root}' }, undefined);

    expect(applies).toBe(false);
  });

  it('still recreates a genuinely missing shared root', async () => {
    const identifier = { namespace: 'qr-shared', key: 'root' };

    expect(interceptor.appliesTo(identifier, undefined)).toBe(true);

    await interceptor.invoke(identifier, {});

    expect(saveSpy).toHaveBeenCalled();
    const model = saveSpy.calls.mostRecent().args[0];
    expect(model.identifier).toEqual({ namespace: 'qr-shared', key: 'root' });
    expect(model.composition).toEqual([]);
  });

  it('still recreates a missing user folder', async () => {
    const identifier = { namespace: 'qr-qrtester', key: 'root' };

    expect(interceptor.appliesTo(identifier, undefined)).toBe(true);

    await interceptor.invoke(identifier, {});

    expect(saveSpy).toHaveBeenCalled();
  });

  it('ignores existing objects and the user container', () => {
    expect(
      interceptor.appliesTo({ namespace: 'qr-shared', key: 'root' }, { name: 'QR Store' })
    ).toBe(false);
    expect(interceptor.appliesTo({ namespace: 'qr-users', key: 'container' }, undefined)).toBe(
      false
    );
  });
});
