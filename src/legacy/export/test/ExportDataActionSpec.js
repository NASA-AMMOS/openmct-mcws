/*global define,describe,beforeEach,jasmine,spyOn,Promise,it,expect,waitsFor,runs,afterEach*/

define([
    '../src/ExportDataAction'
], function (ExportDataAction) {
    'use strict';

    describe("The Export Data action", function () {
        var mockExportService,
            openmct,
            mockTelemetryObject,
            mockRealtimeOnlyTelemetryObject,
            mockDelegatingObject,
            mockDelegateObjects,
            mockNotification,
            mockCallback,
            telemetryPromises,
            telemetryRequested;

        function makeMockDomainObject(id, capabilities, realtimeOnly) {
            var mockDomainObject = jasmine.createSpyObj('object-' + id, [
                    'getId',
                    'getModel',
                    'hasCapability',
                    'useCapability',
                    'getCapability'
                ]);
            mockDomainObject.getId.and.returnValue(id);
            mockDomainObject.getModel.and.returnValue({telemetry: {realtimeOnly: realtimeOnly}});
            mockDomainObject.hasCapability.and.callFake(function (c) {
                return !!(capabilities[c]);
            });
            mockDomainObject.getCapability.and.callFake(function (c) {
                return capabilities[c];
            });
            mockDomainObject.useCapability.and.callFake(function (c) {
                return capabilities[c].invoke();
            });
            return mockDomainObject;
        }

        function telemetryPromise() {
            return new Promise(function (resolve, reject) {
                telemetryPromises.push({ resolve: resolve, reject: reject });
                setTimeout(telemetryRequested);
            });
        }

        function makeMockTelemetryObject(id) {
            var mockTelemetry = jasmine.createSpyObj('telemetry-' + id, [
                    'requestData',
                    'subscribe'
                ]);
            mockTelemetry.requestData.and.callFake(telemetryPromise);
            return makeMockDomainObject(id, { telemetry: mockTelemetry });
        }

        function makeMockRealtimeOnlyTelemetryObject(id) {
            var mockTelemetry = jasmine.createSpyObj('telemetry-' + id, [
                'requestData',
                'subscribe'
            ]);
            mockTelemetry.requestData.and.callFake(telemetryPromise);
            return makeMockDomainObject(id, { telemetry: mockTelemetry }, true);
        }

        beforeEach(function () {
            var mockCapabilities = {
                composition: jasmine.createSpyObj('composition', ['invoke']),
                delegation: jasmine.createSpyObj(
                    'delegation',
                    ['doesDelegateCapability']
                )
            };
            
            telemetryPromises = [];
            telemetryRequested = jasmine.createSpy('telemetryRequested');

            openmct = jasmine.createSpyObj('openmct',
                [
                    'overlays',
                    'notifications'
                ]
            );
            openmct.notifications = jasmine.createSpyObj('notificationService',
                ['error']
            );
            openmct.overlays = jasmine.createSpyObj('overlays',
                ['progressDialog']
            );
            mockExportService = jasmine.createSpyObj(
                'exportService',
                ['exportCSV']
            );
            mockNotification = jasmine.createSpyObj('notification', ['dismiss']);
            mockTelemetryObject = makeMockTelemetryObject('singular');
            mockRealtimeOnlyTelemetryObject = makeMockRealtimeOnlyTelemetryObject('singular');
            mockDelegateObjects =
                ['a', 'b', 'c'].map(makeMockTelemetryObject);
            mockDelegatingObject =
                makeMockDomainObject('delegator', mockCapabilities);

            openmct.overlays.progressDialog.and.returnValue(mockNotification);

            mockCapabilities.delegation.doesDelegateCapability
                .and.callFake(function (c) {
                    return c === 'telemetry';
                });
            mockCapabilities.composition.invoke
                .and.returnValue(Promise.resolve(mockDelegateObjects));

            mockCallback = jasmine.createSpy('callback');
        });


        it("applies to objects with a telemetry capability", function () {
            expect(ExportDataAction.appliesTo({
                domainObject: mockTelemetryObject
            })).toBe(true);
        });

        it("applies to objects which delegate the telemetry capability", function () {
            expect(ExportDataAction.appliesTo({
                domainObject: mockDelegatingObject
            })).toBe(true);
        });

        it("does not apply to objects with no such capabilities", function () {
            expect(ExportDataAction.appliesTo({
                domainObject: makeMockDomainObject('foo', {})
            })).toBe(false);
        });

        it("does not apply to realtime only telemetry objects", function () {
            expect(ExportDataAction.appliesTo({
                domainObject: mockRealtimeOnlyTelemetryObject
            })).toBe(false);
        });


        [ false, true ].forEach(function (singular) {
            var targetDescription = singular ?
                "a single object" : "multiple objects";

            describe("when performed on " + targetDescription, function () {
                var mockTarget;

                beforeEach(function (done) {
                    mockTarget = singular ?
                        mockTelemetryObject : mockDelegatingObject;
                    telemetryRequested.and.callFake(done);

                    new ExportDataAction(
                        mockExportService,
                        openmct,
                        { domainObject: mockTarget }
                    ).perform().then(mockCallback);
                });

                it("shows a progress notification", function () {
                    expect(openmct.overlays.progressDialog)
                        .toHaveBeenCalled();
                });

                if (singular) {
                    it("initiates a telemetry request", function () {
                        expect(telemetryPromises.length).toEqual(1);
                    });
                } else {
                    it("initiates telemetry requests", function () {
                        expect(telemetryPromises.length)
                            .toEqual(mockDelegateObjects.length);
                    });
                }

                describe("and data is provided", function () {
                    beforeEach(function (done) {
                        mockCallback.and.callFake(done);

                        telemetryPromises.forEach(function (p, i) {
                            var mockSeries = jasmine.createSpyObj(
                                'series-' + i,
                                [ 'getData' ]
                            );
                            mockSeries.getData.and.returnValue([]);
                            p.resolve(mockSeries);
                        });
                    });

                    it("dismisses its progress notification", function () {
                        expect(mockNotification.dismiss)
                            .toHaveBeenCalled();
                    });

                    it("triggers a CSV export", function () {
                        expect(mockExportService.exportCSV)
                            .toHaveBeenCalledWith(
                                jasmine.any(Array),
                                { headers: jasmine.any(Array) }
                            );
                    });
                });

                describe("and a request failure occurs", function () {
                    beforeEach(function (done) {
                        mockCallback.and.callFake(done);
                        telemetryPromises[0].reject();
                    });

                    it("dismisses its progress notification", function () {
                        expect(mockNotification.dismiss)
                            .toHaveBeenCalled();
                    });

                    it("displays an error notification", function () {
                        expect(openmct.notifications.error)
                            .toHaveBeenCalled();
                    });
                });

            });
        });
    });
});