/*global define,describe,beforeEach,jasmine,spyOn,Promise,it,expect,waitsFor,runs,afterEach*/

define([
    './ExportDataTask'
], function (ExportDataTaskModule) {
    const ExportDataTask = ExportDataTaskModule.default;

    describe('ExportDataTask', () => {
        let testIds;
        let testTelemetryData;
        let mockTelemetryObjects;
        let mockOpenMct;
        let pendingPromises;
        let task;

        function makeMockTelemetryObject(id) {
            const mockTelemetryObject = {
                identifier: {
                    namespace: 'object',
                    key: id
                }
            };

            return mockTelemetryObject;
        }

        beforeEach(() => {
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
                    { x: 'foo', id: 'c' }
                ]
            };

            mockOpenMct = {};
            mockOpenMct.telemetry = jasmine.createSpyObj('telemetryApi', [
                'request'
            ]);
            mockOpenMct.telemetry.request.and.callFake(function (telemetryObject) {
                return Promise.resolve(testTelemetryData[telemetryObject.identifier.key]);
            });

            pendingPromises = [];

            spyOn(ExportDataTask.prototype, 'exportCSV').and.callThrough();

            mockTelemetryObjects = ['a', 'b', 'c'].map(makeMockTelemetryObject);

            task = new ExportDataTask(mockOpenMct, 'TestObject', mockTelemetryObjects);
        });

        describe('when invoked', () => {

            beforeEach(async () => {
                await task.invoke();
            });

            it('requests comprehensive telemetry for all objects', () => {
                testIds.forEach(function (id) {
                    const telemetryObject = mockTelemetryObjects.find(obj => obj.identifier.key === id);
                    expect(mockOpenMct.telemetry.request)
                        .toHaveBeenCalledWith(telemetryObject, { strategy: 'comprehensive' });
                });
            });

            describe('and data is received', () => {

                it('initiates a CSV export', () => {
                    expect(ExportDataTask.prototype.exportCSV).toHaveBeenCalled();
                });

                it('includes rows for telemetry for all objects', () => {
                    const rows = ExportDataTask.prototype.exportCSV.calls.mostRecent().args[0];
                    expect(rows.length).toEqual(testIds.map(function (id) {
                        return testTelemetryData[id].length;
                    }).reduce(function (a, b) { return a + b; }));
                });

                it('includes headers for all data properties', () => {
                    const options = ExportDataTask.prototype.exportCSV.calls.mostRecent().args[1];
                    const headers = options.headers;
                    expect(headers.sort()).toEqual(['id', 'x', 'y', 'z']);
                });

                it('contains all telemetry data for all objects', () => {
                    const rows = ExportDataTask.prototype.exportCSV.calls.mostRecent().args[0];
                    const options = ExportDataTask.prototype.exportCSV.calls.mostRecent().args[1];
                    const headers = options.headers;

                    function hasValue(id, key, value) {
                        return rows.some(function (row) {
                            return row.id === id && row[key] === value;
                        });
                    }

                    testIds.forEach(function (id) {
                        testTelemetryData[id].forEach(function (datum) {
                            Object.keys(datum).forEach(function (key) {
                                expect(hasValue(id, key, datum[key])).toBeTruthy();
                            });
                        });
                    });
                });
            });
        });
    });
});
