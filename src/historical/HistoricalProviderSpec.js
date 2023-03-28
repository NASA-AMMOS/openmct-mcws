/*global define,describe,beforeEach,it,jasmine,expect*/

define([
    './HistoricalProvider'
], function (
    HistoricalProvider
) {
    'use strict';

    describe('Historical Provider', function () {
        let historicalProvider;
        let mockOpenMct;
        let mockMetadata;
        let options;
        let mockDomainObject;
        let mockSessionService;
        let mockNotification;
        let resolveCallback;
        let rejectCallback;

        beforeEach(function () {
            options = {
                domain: 'scet'
            };
            mockOpenMct = {};

            mockOpenMct.telemetry = jasmine.createSpyObj('telemetryApi', [
                'getMetadata'
            ]);
            mockMetadata = jasmine.createSpyObj('metadata', [
                'value',
                'values'
            ]);
            mockMetadata.values.and.returnValue([]);
            mockOpenMct.telemetry.getMetadata.and.returnValue(mockMetadata);
            mockMetadata.value.and.returnValue({
                'key': 'scet'
            });

            mockSessionService = jasmine.createSpyObj('sessionService', [
                'getHistoricalSession'
            ]);
            mockOpenMct.$injector = jasmine.createSpyObj('injector', [
                'get'
            ]);
            mockOpenMct.$injector.get.and.returnValue(mockSessionService);
            mockOpenMct.notifications = jasmine.createSpyObj('notificationAPI', [
                'alert'
            ]);
            mockNotification = jasmine.createSpyObj('notification', [
                'on',
                'off'
            ]);
            mockOpenMct.notifications.alert.and.returnValue(mockNotification);


            historicalProvider = new HistoricalProvider(mockOpenMct);

            resolveCallback = rejectCallback = (response) => {};
        });

        describe ('min-max requests', function() {
            beforeEach(function () {
                mockDomainObject = {
                    identifier: {
                        namespace: 'test-namesapce',
                        key: 'test-key'
                    },
                    type: 'vista.channel',
                    telemetry: {
                        channelMinMaxUrl: 'some-url'
                    }
                }
                options.size = 2;
                options.strategy = 'minmax';
            });
            it('show a warning when filters are defined', function () {
                options.filters = {
                    filterName: {
                        equals: ['someValue']
                    }
                };
                historicalProvider.request(mockDomainObject, options).then(resolveCallback, rejectCallback);
                expect(mockOpenMct.notifications.alert).toHaveBeenCalled();
            });
    
            describe('do not show a warning', function () {
                it('when filters are undefined', function () {
                    options.filters = undefined;
                    historicalProvider.request(mockDomainObject, options).then(resolveCallback, rejectCallback);;
                    expect(mockOpenMct.notifications.alert).not.toHaveBeenCalled();
                });
                it('when filters are empty', function () {
                    options.filters = {
                        somekey: {}
                    };
                    historicalProvider.request(mockDomainObject, options).then(resolveCallback, rejectCallback);;
                    expect(mockOpenMct.notifications.alert).not.toHaveBeenCalled();
                });
            })
        });
        describe('non min-max requests', function() {
            beforeEach(function () {
                mockDomainObject = {
                    identifier: {
                        namespace: 'test-namesapce',
                        key: 'test-key'
                    },
                    type: 'vista.channel',
                    telemetry: {
                        channelMinMaxUrl: 'some-url'
                    }
                }
            });
            it('Do not show a warning when filters are defined', function () {
                options.filters = {
                    filterName: 'filterValue'
                };
                historicalProvider.request(mockDomainObject, options);
                expect(mockOpenMct.notifications.alert).not.toHaveBeenCalled();
            });    
        });
    });
});
