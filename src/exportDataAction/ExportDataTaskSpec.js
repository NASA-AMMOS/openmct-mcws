/*global define,describe,beforeEach,jasmine,spyOn,Promise,it,expect,waitsFor,runs,afterEach*/

define([
    '../src/ExportDataTask'
], function (ExportDataTask) {
    'use strict';

    describe("ExportDataTask", function () {
        var testIds,
            testTelemetryData,
            mockExportService,
            mockTelemetryObjects,
            mockTelemetryCapabilities,
            pendingPromises,
            task;

        function makeMockTelemetryObject(id) {
            var mockTelemetryObject = jasmine.createSpyObj(
                    'object-' + id,
                    [ 'getId', 'getModel', 'getCapability' ]
                ),
                mockTelemetryCapability = jasmine.createSpyObj(
                    'telemetry-' + id,
                    [ 'requestData' ]
                ),
                mockTelemetrySeries = jasmine.createSpyObj(
                    'series-' + id,
                    [ 'getData' ]
                ),
                seriesPromise = Promise.resolve(mockTelemetrySeries);

            mockTelemetryObject.getId.and.returnValue(id);
            mockTelemetryObject.getModel.and.returnValue({});
            mockTelemetryObject.getCapability.and.callFake(function (c) {
                return c === 'telemetry' && mockTelemetryCapability;
            });

            mockTelemetryCapability.requestData.and.returnValue(seriesPromise);
            mockTelemetrySeries.getData.and.returnValue(testTelemetryData[id]);

            mockTelemetryCapabilities[id] = mockTelemetryCapability;

            pendingPromises.push(seriesPromise);

            return mockTelemetryObject;
        }

        beforeEach(function () {
            testIds = [ 'a', 'b', 'c' ];

            testTelemetryData = {
                a: [
                    { x: 1, y: 2, id: 'a' },
                    { x: 3, y: 2, id: 'a' },
                    { x: 0, y: 1, id: 'a' }
                ],
                b: [
                    { y : 2, z: 6, id: 'b' },
                    { y : 3, z: 7, id: 'b' },
                    { y : 1, z: 8, id: 'b' }
                ],
                c: [
                    { x: "foo", id: 'c' }
                ]
            };

            pendingPromises = [];

            mockTelemetryCapabilities = {};

            mockExportService = jasmine.createSpyObj(
                'exportService',
                [ 'exportCSV' ]
            );
            mockTelemetryObjects =
                ['a', 'b', 'c'].map(makeMockTelemetryObject);

            task = new ExportDataTask(mockExportService, mockTelemetryObjects);
        });

        describe("when performed", function () {
            let taskPromise;

            beforeEach(function () {
                taskPromise = task.perform();
            });

            it("requests comprehensive telemetry for all objects", function () {
                testIds.forEach(function (id) {
                    expect(mockTelemetryCapabilities[id].requestData)
                        .toHaveBeenCalledWith({ strategy: 'comprehensive' });
                });
            });

            describe("and data is received", function () {
                beforeEach(function () {
                    return taskPromise;
                });

                it("initiates a CSV export", function () {
                    expect(mockExportService.exportCSV)
                        .toHaveBeenCalled();
                });

                it("includes rows for telemetry for all objects", function () {
                    var rows =
                        mockExportService.exportCSV.calls.mostRecent().args[0];
                    expect(rows.length).toEqual(testIds.map(function (id) {
                        return testTelemetryData[id].length;
                    }).reduce(function (a, b) { return a + b; }));
                });

                it("includes headers for all data properties", function () {
                    var options =
                        mockExportService.exportCSV.calls.mostRecent().args[1],
                        headers = options.headers;
                    expect(headers.sort()).toEqual(['id', 'x', 'y', 'z']);
                });

                it("contains all telemetry data for all objects", function () {
                    var rows =
                            mockExportService.exportCSV.calls.mostRecent().args[0],
                        options =
                            mockExportService.exportCSV.calls.mostRecent().args[1],
                        headers = options.headers;

                    function hasValue(id, key, value) {
                        return rows.filter(function (row) {
                            return row.id === id && row[key] === value;
                        }).length > 0;
                    }

                    testIds.forEach(function (id) {
                        testTelemetryData[id].forEach(function (datum) {
                            Object.keys(datum).forEach(function (key) {
                                expect(hasValue(id, key, datum[key]))
                                    .toBeTruthy();
                            });
                        });
                    });
                });
            });
        });
    });
});
