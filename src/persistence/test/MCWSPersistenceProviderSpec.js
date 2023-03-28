/*global define,Promise,describe,it,expect,beforeEach,jasmine*/

define([
    "../src/MCWSPersistenceProvider",
    '../../../services/mcws/mcws'
], function (
    MCWSPersistenceProvider,
    mcwsDefault
) {
    "use strict";

    const mcws = mcwsDefault.default;

    describe("The MCWS Persistence Provider", function () {
        var mockQ,
            mockNamespaceService,
            persistenceNamespaces,
            mockNamespace,
            mockOpaqueFile,
            persistence;

        beforeEach(function () {
            mockQ = jasmine.createSpyObj("$q", ["when"]);
            spyOn(mcws, 'namespace');
            mockNamespaceService = jasmine.createSpyObj(
                "namespaceService",
                ["getPersistenceNamespaces"]
            );
            persistenceNamespaces = [
                {
                    key: "testSpace",
                    url: "/test/namespace"
                },
                {
                    key: "testSpace2",
                    url: "/test/namespace2"
                }
            ];

            mockNamespaceService
                .getPersistenceNamespaces
                .and.returnValue(Promise.resolve(persistenceNamespaces));


            mockNamespace =
                jasmine.createSpyObj("namespace", ["opaqueFile", "read"]);
            mockOpaqueFile = jasmine.createSpyObj("opaqueFile", [
                "read",
                "replace",
                "remove",
                "create"
            ]);

            mockQ.when.and.callFake(function (resolver) {
                return Promise.resolve(resolver);
            });

            mcws.namespace.and.returnValue(mockNamespace);
            mockNamespace.opaqueFile.and.returnValue(mockOpaqueFile);

            persistence = new MCWSPersistenceProvider(
                mockQ,
                mockNamespaceService
            );
        });

        it("provides a promise for available spaces", function (done) {
            persistence.listSpaces()
                .then(function (spaces) {
                    expect(spaces).toEqual(['testSpace', 'testSpace2']);
                    done();
                })
        });

        it("provides a listing of identifiers", function (done) {
            mockNamespace.read.and.returnValue(Promise.resolve([
                {
                    Subject: "/test/namespace/a",
                    Predicate: "has MIO type",
                    Object: "opaque_file"
                },
                {
                    Subject: "/test/namespace/b",
                    Predicate: "has MIO type",
                    Object: "namespace"
                },
                {
                    Subject: "/test/namespace/c",
                    Predicate: "something else",
                    Object: "opaque_file"
                },
                {
                    Subject: "/some/namespace/xyz",
                    Predicate: "has MIO type",
                    Object: "opaque_file"
                },
                {
                    Subject: "/some/namespace/123-ABC",
                    Predicate: "has MIO type",
                    Object: "opaque_file"
                }
            ]));
            persistence
                .listObjects("testSpace")
                .then(function (objects) {
                    expect(objects).toEqual(["a", "xyz", "123-ABC"]);
                    done();
                });
        });

        it("allows objects to be created", function (done) {
            mockOpaqueFile.create.and.returnValue(Promise.resolve(true));
            persistence
                .createObject(
                    "testSpace",
                    "testKey",
                    { someKey: "some value" }
                )
                .then(function (result) {
                    expect(result).toBe(true);
                    expect(mockNamespace.opaqueFile)
                        .toHaveBeenCalledWith("testKey");
                    expect(mockOpaqueFile.create)
                        .toHaveBeenCalledWith({ someKey: "some value" });
                    done();
                });
        });

        it("allows objects to be read", function (done) {
            mockOpaqueFile.read.and.returnValue(Promise.resolve("test object"));
            persistence
                .readObject("testSpace", "testKey")
                .then(function (object) {
                    expect(object).toBe("test object");
                    expect(mcws.namespace)
                        .toHaveBeenCalledWith("/test/namespace");
                    expect(mockNamespace.opaqueFile)
                        .toHaveBeenCalledWith("testKey");
                    expect(mockOpaqueFile.read)
                        .toHaveBeenCalled();
                    done();
                });
        });

        it("allows objects to be updated", function (done) {
            mockOpaqueFile.replace.and.returnValue(Promise.resolve(true));
            persistence
                .updateObject(
                    "testSpace",
                    "testKey",
                    { someKey: "some value" }
                )
                .then(function (result) {
                    expect(result).toBe(true);
                    expect(mcws.namespace)
                        .toHaveBeenCalledWith("/test/namespace");
                    expect(mockNamespace.opaqueFile)
                        .toHaveBeenCalledWith("testKey");
                    expect(mockOpaqueFile.replace)
                        .toHaveBeenCalledWith({ someKey: "some value" });
                    done();
                })
        });

        it("allows objects to be deleted", function (done) {
            mockOpaqueFile.remove.and.returnValue(Promise.resolve(true));
            persistence
                .deleteObject("testSpace", "testKey")
                .then(function (result) {
                    expect(mcws.namespace)
                        .toHaveBeenCalledWith("/test/namespace");
                    expect(mockNamespace.opaqueFile)
                        .toHaveBeenCalledWith("testKey");
                    expect(mockOpaqueFile.remove).toHaveBeenCalled();
                    done();
                })
        });

        it("converts rejected promises to promises resolves to undefined", function (done) {
            mockOpaqueFile.read.and.returnValue(Promise.reject("hello"));
            persistence
                .readObject("testSpace", "testKey")
                .then(function (result) {
                    expect(result).toBeUndefined();
                    done();
                })
        });
    });
});
