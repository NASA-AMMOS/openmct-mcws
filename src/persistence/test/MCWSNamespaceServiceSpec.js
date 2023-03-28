/*global define,describe,beforeEach,jasmine,Promise,it,expect*/

define([
    '../src/MCWSNamespaceService',
    'services/mcws/mcws'
], function (
    MCWSNamespaceService,
    mcwsDefault
) {
    'use strict';

    const mcws = mcwsDefault.default;

    describe('MCWSNamespaceService', function () {
        var $window,
            namespaceMIOs,
            mockUserAPI,
            mockOpenmct,
            sharedRootDefinition,
            inaccessibleSharedRootDefinition,
            missingSharedRootDefinition,
            sharedRootDefinitions,
            containerRootDefinition,
            missingContainerRootDefinition,
            inaccessibleContainerRootDefinition,
            containerRootDefinitions,
            namespaceService;

        beforeEach(function () {
            $window = {
                location: {
                    pathname: '/mcws/clients/vista/'
                }
            };

            namespaceMIOs = {};

            spyOn(mcws, 'namespace');

            mcws.namespace.and.callFake(function (namespaceUrl) {
                var namespace = namespaceMIOs[namespaceUrl];

                if (!namespace) {
                    namespace = namespaceMIOs[namespaceUrl] =
                        jasmine.createSpyObj(
                            'namespace:' + namespaceUrl,
                            ['read', 'create']
                        );

                    namespace.created = false;

                    namespace.create.and.callFake(function () {
                        return Promise.resolve()
                            .then(function () {
                                namespace.created = true;
                                return [];
                            });
                    });

                    namespace.read.and.callFake(function () {
                        if (namespaceUrl.indexOf('missing') !== -1 &&
                            !namespace.created) {
                            return Promise.reject({
                                status: 404
                            });
                        }
                        if (namespaceUrl.indexOf('inaccessible') !== -1) {
                            return Promise.reject({});
                        }
                        return Promise.resolve([]);
                    });
                }

                return namespace;
            });

            mockUserAPI = jasmine.createSpyObj('userAPI', [
                'getCurrentUser'
            ]);

            mockUserAPI.getCurrentUser
                .and.returnValue(
                    Promise.resolve({
                        id: 'someUser',
                        name: 'someUser'
                    })
            );

            mockOpenmct = {
                user: mockUserAPI
            };

            sharedRootDefinition = {
                id: 'shared:root',
                key: 'shared',
                name: 'Shared',
                url: '/some/shared/namespace'
            };
            inaccessibleSharedRootDefinition = {
                id: 'inaccessible-shared:root',
                key: 'inaccessible-shared',
                name: 'Inaccessible Shared',
                url: '/inaccessible/shared/namespace'
            };
            missingSharedRootDefinition = {
                id: 'missing-shared:root',
                key: 'missing-shared',
                name: 'Missing Shared',
                url: '/missing/shared/namespace'
            };

            sharedRootDefinitions = [
                sharedRootDefinition,
                inaccessibleSharedRootDefinition,
                missingSharedRootDefinition
            ];

            containerRootDefinition = {
                id: 'personal',
                key: 'personal',
                name: 'personal',
                url: '/some/personal/namespace',
                containsNamespaces: true,
                childTemplate: {
                    id: 'personal-${USER}:root',
                    key: 'personal-${USER}',
                    name: '${USER}',
                    url: '/some/personal/namespace/${USER}'
                }
            };
            inaccessibleContainerRootDefinition = {
                id: 'inaccessible-personal',
                key: 'inaccessible-personal',
                name: 'inaccessible-personal',
                url: '/inaccessible/personal/namespace',
                containsNamespaces: true,
                childTemplate: {
                    id: 'inaccessible-personal-${USER}:root',
                    key: 'inaccessible-personal-${USER}',
                    name: '${USER}',
                    url: '/inaccessible/personal/namespace/${USER}'
                }
            };
            missingContainerRootDefinition = {
                id: 'missing-personal',
                key: 'missing-personal',
                name: 'missing-personal',
                url: '/missing/personal/namespace',
                containsNamespaces: true,
                childTemplate: {
                    id: 'missing-personal-${USER}:root',
                    key: 'missing-personal-${USER}',
                    name: '${USER}',
                    url: '/missing/personal/namespace/${USER}'
                }
            };

            containerRootDefinitions = [
                containerRootDefinition,
                missingContainerRootDefinition,
                inaccessibleContainerRootDefinition
            ];

            namespaceService = new MCWSNamespaceService(
                mockOpenmct,
                $window,
                sharedRootDefinitions.concat(containerRootDefinitions)
            );
        });

        describe('getRootNamespaces', function () {
            var result;

            beforeEach(function (done) {
                namespaceService
                    .getRootNamespaces()
                    .then(function (namespaceDefinitions) {
                        result = namespaceDefinitions;
                    })
                    .then(done);
            });

            it('returns container namespaces', function () {
                expect(result).toContain(containerRootDefinition);
            });

            it('creates missing container namespaces ', function () {
                expect(result).toContain(missingContainerRootDefinition);
            });

            it('removes inaccessible container namespaces', function () {
                expect(result)
                    .not
                    .toContain(inaccessibleContainerRootDefinition);
            });

            it('returns normal namespaces', function () {
                expect(result).toContain(sharedRootDefinition);
            });

            it('creates missing normal namespaces ', function () {
                expect(result).toContain(missingSharedRootDefinition);
            });

            it('removes inaccessible normal namespaces', function () {
                expect(result).not.toContain(inaccessibleSharedRootDefinition);
            });
        });

        describe('getContainedNamespaces', function () {
            var userRootNamespaceMIO,
                userNamespaceMIO,
                otherUserNamespaceMIO;

            beforeEach(function () {
                var namespaceMIOs = {};
                mcws.namespace.and.callFake(function (namespaceUrl) {
                    return namespaceMIOs[namespaceUrl];
                });
                userRootNamespaceMIO =
                    namespaceMIOs['/some/personal/namespace'] =
                    jasmine.createSpyObj(
                        'userNamespace',
                        ['read', 'create']
                    );
                userRootNamespaceMIO.read.and.returnValue(Promise.resolve([]));

                userNamespaceMIO =
                    namespaceMIOs['/some/personal/namespace/someUser'] =
                    jasmine.createSpyObj(
                        'userNamespaceMIO',
                        ['read', 'create']
                    );
                userNamespaceMIO.read.and.returnValue(Promise.resolve([]));

                otherUserNamespaceMIO =
                    namespaceMIOs['/some/personal/namespace/otherUser'] =
                    jasmine.createSpyObj(
                        'otherUserNamespace',
                        ['read', 'create']
                    );

                otherUserNamespaceMIO.read.and.returnValue(Promise.resolve([]));
            });

            function expectCurrentUserDefinition(definition) {
                expect(definition.id).toBe('personal-someUser:root');
                expect(definition.key).toBe('personal-someUser');
                expect(definition.name).toBe('someUser');
                expect(definition.url)
                    .toBe('/some/personal/namespace/someUser');
                expect(definition.location).toBe('personal');
            }

            function expectOtherUserDefinition(definition) {
                expect(definition.id).toBe('personal-otherUser:root');
                expect(definition.key).toBe('personal-otherUser');
                expect(definition.name).toBe('otherUser');
                expect(definition.url)
                    .toBe('/some/personal/namespace/otherUser');
                expect(definition.location).toBe('personal');
            }

            it('returns contents with current user first', function (done) {
                userRootNamespaceMIO.read.and.returnValue(Promise.resolve([
                    {
                        object: 'namespace',
                        subject: '/some/personal/namespace/otherUser'
                    },
                    {
                        object: 'namespace',
                        subject: '/some/personal/namespace/someUser'
                    }
                ]));

                namespaceService
                    .getContainedNamespaces(containerRootDefinition)
                    .then(function (contents) {
                        expect(userNamespaceMIO.create)
                            .not
                            .toHaveBeenCalled();
                        expect(otherUserNamespaceMIO.create)
                            .not
                            .toHaveBeenCalled();

                        expect(contents.length).toBe(2);
                        expectCurrentUserDefinition(contents[0]);
                        expectOtherUserDefinition(contents[1]);
                    })
                    .then(done);
            });

            it('creates user if missing', function (done) {
                userRootNamespaceMIO.read.and.returnValue(Promise.resolve([]));
                userNamespaceMIO.read.and.returnValue(Promise.reject({status: 404}));
                userNamespaceMIO.create.and.returnValue(Promise.resolve([]));

                namespaceService
                    .getContainedNamespaces(containerRootDefinition)
                    .then(function (contents) {
                        expect(contents.length).toBe(1);
                        expect(userNamespaceMIO.create)
                            .toHaveBeenCalled();
                        expectCurrentUserDefinition(contents[0]);
                    })
                    .then(done);
            });
        });

        describe('namespace filtering', function () {
            var smapDefinition,
                mslDefinition,
                ammosDefinition,
                filterDefinitions;

            beforeEach(function () {
                smapDefinition = {
                    key: 'smap-thing',
                    url: '/path/to/smap-namespace'
                };
                mslDefinition = {
                    key: 'msl-thing',
                    url: '/path/to/msl-namespace'
                };
                ammosDefinition = {
                    key: 'ammos-thing',
                    url: '/path/to/ammos-namespace'
                };
                filterDefinitions = [
                    smapDefinition,
                    mslDefinition,
                    ammosDefinition
                ];

                namespaceService = new MCWSNamespaceService(
                    mockOpenmct,
                    $window,
                    filterDefinitions
                );
            });

            it('does not filter with default path', function (done) {
                namespaceService
                    .getRootNamespaces()
                    .then(function (namespaces) {
                        expect(namespaces).toEqual(filterDefinitions);
                    })
                    .then(done);
            });

            it('only includes smap with smap-path', function (done) {
                $window.location.pathname = '/mcws/clients/vista-smap/';
                namespaceService
                    .getRootNamespaces()
                    .then(function (namespaces) {
                        expect(namespaces).toEqual([smapDefinition]);
                    })
                    .then(done);
            });

            it('only includes msl with msl-path', function (done) {
                $window.location.pathname = '/mcws/clients/vista-msl/';
                namespaceService
                    .getRootNamespaces()
                    .then(function (namespaces) {
                        expect(namespaces).toEqual([mslDefinition]);
                    })
                    .then(done);
            });

            it('only includes ammos with ammos-path', function (done) {
                $window.location.pathname = '/mcws/clients/vista-ammos/';
                namespaceService
                    .getRootNamespaces()
                    .then(function (namespaces) {
                        expect(namespaces).toEqual([ammosDefinition]);
                    })
                    .then(done);
            });
        });
    });
});
