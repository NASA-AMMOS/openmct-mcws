/*global define,describe,beforeEach,jasmine,Promise,it,expect*/
define([
    '../src/MCWSNamespaceModelProvider'
], function (
    MCWSNamespaceModelProvider
) {
    'use strict';

    describe('MCWSNamespaceModelProvider', function () {
        var namespaceService,
            someNamespace,
            anotherNamespace,
            personalContainerNamespace,
            personalNamespace,
            namespaces,
            provider;

        beforeEach(function () {
            namespaceService = jasmine.createSpyObj(
                'namespaceService',
                [
                    'getPersistenceNamespaces',
                    'getContainedNamespaces'
                ]
            );

            someNamespace = {
                id: 'some-namespace:root',
                key: 'some-namespace',
                name: 'Some Namespace',
                url: '/some/namespace/url'
            };
            anotherNamespace = {
                id: 'another-namespace:root',
                key: 'another-namespace',
                name: 'Another Namespace',
                url: '/another/namespace/url',
                location: 'some-namespace:root'
            };
            personalContainerNamespace = {
                id: 'personal',
                key: 'personal',
                name: 'personal',
                url: '/some/personal/namespace'
            };
            personalNamespace = {
                id: 'personal-myUser:root',
                key: 'personal-myUser}',
                name: 'myUser',
                url: '/some/personal/namespace/myUser',
                location: 'personal'
            };

            namespaces = [
                someNamespace,
                anotherNamespace,
                personalContainerNamespace,
                personalNamespace
            ];

            namespaceService
                .getPersistenceNamespaces
                .and.returnValue(Promise.resolve(namespaces));

            namespaceService
                .getContainedNamespaces
                .and.callFake(function (namespace) {
                    if (namespace.id === 'personal') {
                        return Promise.resolve([personalNamespace]);
                    }
                    return Promise.resolve([]);
                });

            provider = new MCWSNamespaceModelProvider(namespaceService);
        });

        describe('getModels', function () {
            var someNamespaceModel,
                anotherNamespaceModel,
                personalContainerNamespaceModel,
                personalNamespaceModel,
                allNamespaceModels;

            beforeEach(function (done) {
                provider
                    .getModels([
                        'some-namespace:root',
                        'another-namespace:root',
                        'personal',
                        'personal-myUser:root'
                    ])
                    .then(function (models) {
                        someNamespaceModel = models['some-namespace:root'];
                        anotherNamespaceModel =
                            models['another-namespace:root'];
                        personalContainerNamespaceModel = models.personal;
                        personalNamespaceModel = models['personal-myUser:root'];
                        allNamespaceModels = [
                            someNamespaceModel,
                            anotherNamespaceModel,
                            personalContainerNamespaceModel,
                            personalNamespaceModel
                        ];
                    })
                    .then(done);
            });

            it('sets type to folder', function () {
                allNamespaceModels.forEach(function (namespaceModel) {
                    expect(namespaceModel.type).toBe('folder');
                });
            });

            it('uses location specified in namespace definition', function () {
                expect(anotherNamespaceModel.location)
                    .toBe('some-namespace:root');
                expect(personalNamespaceModel.location)
                    .toBe('personal');
            });

            it('sets default location if not specified', function () {
                expect(someNamespaceModel.location).toBe('ROOT');
                expect(personalContainerNamespaceModel.location).toBe('ROOT');
            });

            it('sets composition', function () {
                expect(someNamespaceModel.composition)
                    .toEqual(jasmine.any(Array));
                expect(anotherNamespaceModel.composition)
                    .toEqual(jasmine.any(Array));
                expect(personalContainerNamespaceModel.composition)
                    .toEqual(['personal-myUser:root']);
                expect(personalNamespaceModel.composition)
                    .toEqual(jasmine.any(Array));
            });
        });
    });
});
