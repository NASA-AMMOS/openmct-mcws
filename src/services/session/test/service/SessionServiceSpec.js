/*global define,describe,beforeEach,Promise,jasmine,it,expect*/

define([
    '../../src/services/SessionService',
    '../../../../services/mcws/mcws'
], function (
    SessionService,
    mcwsDefault
) {
    'use strict';
    const mcws = mcwsDefault.default;
    describe('SessionService', function () {
        let $q,
            dataTable,
            topic,
            datasetCache,
            openmct,
            sessionService,
            sessionTopic,
            sessionHistoricalTopic

        beforeEach(function () {
            spyOn(mcws, 'dataTable');
            
            // mcws = jasmine.createSpyObj(
            //     'mcws',
            //     ['dataTable']
            // );
            dataTable = jasmine.createSpyObj(
                'dataTable',
                ['read']
            );
            
            topic = jasmine.createSpy('topic');
            sessionTopic = jasmine.createSpyObj(
                'sessionTopic',
                [
                    'listen',
                    'notify'
                ]
            );
            sessionHistoricalTopic = jasmine.createSpyObj(
                'sessionHistoricalTopic',
                [
                    'listen',
                    'notify'
                ]
            );
            topic.withArgs('vista.session').and.returnValue(sessionTopic);
            topic.withArgs('vista.session.historical').and.returnValue(sessionHistoricalTopic);

            mcws.dataTable.and.returnValue(dataTable);
            dataTable.read.and.returnValue(Promise.resolve());

            datasetCache = {
                datasets: {
                    ':1234': {
                        options: {
                            sessionLADUrl: '/some/session/url',
                            sessionUrl: '/some/historical/session/url'
                        }
                    },
                    ':5678': {
                        options: {
                            sessionLADUrl: '/some/other/session/url',
                            sessionUrl: '/some/other/historical/session/url'
                        }
                    },
                    ':1111': {
                        options: {
                            sessionLADUrl: '/some/session/url',
                            sessionUrl: '/some/historical/session/url'
                        }
                    },
                    ':2222': {
                        options: {
                            sessionLADUrl: '/some/session/url',
                            sessionUrl: '/some/historical/session/url'
                        }
                    },
                    ':3333': {
                        options: {
                            sessionLADUrl: '/some/session/url',
                            sessionUrl: '/some/historical/session/url'
                        }
                    }
                }
            };

            openmct = jasmine.createSpyObj('openmct',
                [
                    'time',
                    '$injector',
                    'objectViews',
                    'notifications'
                ]
            );
            openmct.time = jasmine.createSpyObj('time',
                [
                    'timeSystem',
                    'bounds',
                    'clock'
                ]
            );
            openmct.objectViews = jasmine.createSpyObj('objectViews',
                [
                    'emit'
                ]
            );
            openmct.time.timeSystem.and.returnValue({ key: 'ert' });
            openmct.time.clock.and.returnValue(true);
            
            openmct.notifications = jasmine.createSpyObj('notificationService',
                [
                    'info',
                    'alert'
                ]
            );

            const openmctMCWSConfig = {
                sessions: {
                    historicalSessionFilter: {
                        disable: false,
                        maxRecords: 1000
                    },
                    realtimeSession: {
                        disable: false
                    }
                }
            }

            sessionService = new SessionService(
                $q,
                topic,
                datasetCache,
                openmct,
                openmctMCWSConfig
            );

            sessionService.notifyUserOfHistoricalSessionChange = jasmine.createSpy('notifyUserOfHistoricalSessionChange');
        });

        it('initially has no active topic', function () {
            expect(sessionService.getActiveTopicOrSession()).toBeUndefined();
            expect(sessionService.hasActiveTopicOrSession()).toBe(false);
        });

        it('provides a helper method to listen for changes', function () {
            expect(topic).toHaveBeenCalledWith('vista.session');
            sessionTopic.listen.and.returnValue('myUnsubscribe');
            expect(sessionService.listen('myFunction')).toBe('myUnsubscribe');
            expect(sessionTopic.listen).toHaveBeenCalledWith('myFunction');
        });

        it('provides a helper method to listen for historical changes', function () {
            expect(topic).toHaveBeenCalledWith('vista.session.historical');
            sessionTopic.listen.and.returnValue('myUnsubscribe');
            expect(sessionService.listen('myFunction')).toBe('myUnsubscribe');
            expect(sessionTopic.listen).toHaveBeenCalledWith('myFunction');
        });

        describe('with an active topic/session', function () {
            var activeModel;

            beforeEach(function () {
                activeModel = {
                    topic: 'my.topic.subtopic',
                    jms_subtopic: 'subtopic',
                    number: 4,
                    misc: 'other stuff'
                };

                sessionService.setActiveTopicOrSession(activeModel);
            });

            it('has an active model', function () {
                expect(sessionService.hasActiveTopicOrSession()).toBe(true);
                expect(sessionService.isActiveTopic(activeModel))
                    .toBe(true);
                expect(sessionService.isActiveSession(activeModel))
                    .toBe(true);
                expect(sessionService.getActiveTopicOrSession())
                    .toEqual(activeModel);
            });

            it('does not differentiate via exact equality', function () {
                // Important because getTopicsWithSessions returns new
                // topic/session objects.
                var copyModel = JSON.parse(JSON.stringify(activeModel));
                expect(copyModel).not.toBe(activeModel);
                expect(sessionService.isActiveTopic(activeModel)).toBe(true);
                expect(sessionService.isActiveSession(activeModel)).toBe(true);
            });

            it('notifies topic with active session', function () {
                const connectionMessage = `Connected to realtime from ${activeModel.topic}`;

                expect(sessionTopic.notify).toHaveBeenCalledWith(activeModel);
                expect(sessionService.notificationService.info).toHaveBeenCalledWith(connectionMessage);
            });

            it('does not notify if the same model is selected', function () {
                expect(sessionTopic.notify).toHaveBeenCalledTimes(1);
                let copyModel = JSON.parse(JSON.stringify(activeModel));

                sessionService.setActiveTopicOrSession(activeModel);
                sessionService.setActiveTopicOrSession(copyModel);
                sessionService.setActiveTopicOrSession(activeModel);
                expect(sessionTopic.notify).toHaveBeenCalledTimes(1);
            });

            it('notifies if the active model is cleared ', function () {
                expect(sessionTopic.notify).toHaveBeenCalledTimes(1);
                sessionService.setActiveTopicOrSession(undefined);
                expect(sessionTopic.notify).toHaveBeenCalledWith(undefined);
                expect(sessionTopic.notify).toHaveBeenCalledTimes(2);
            });
            
            it('does not match with different topic', function () {
                const copyModel = JSON.parse(JSON.stringify(activeModel));
                copyModel.topic = copyModel.topic + 1234;

                expect(sessionService.isActiveTopic(copyModel))
                    .toBe(false);
                expect(sessionService.isActiveSession(copyModel))
                    .toBe(false);

            });

            it('does not match with different number', function () {
                const copyModel = JSON.parse(JSON.stringify(activeModel));
                copyModel.number = copyModel.number + 1234;

                expect(sessionService.isActiveTopic(copyModel))
                    .toBe(true);
                expect(sessionService.isActiveSession(copyModel))
                    .toBe(false);
            });

            ['topic', 'number'].forEach(function (key) {
                it('notifies on topic or session change', function () {
                    expect(sessionTopic.notify).toHaveBeenCalledTimes(1);
                    const copyModel = JSON.parse(JSON.stringify(activeModel));

                    copyModel[key] = copyModel[key] + 1234;
                    expect(copyModel[key]).not.toBe(activeModel[key]);
                    sessionService.setActiveTopicOrSession(copyModel);
                    expect(sessionTopic.notify).toHaveBeenCalledTimes(2);
                });
            });
        });

        describe('with an active historical session', function () {
            let model;

            beforeEach(function () {
                model = {
                    topic: 'my.topic.subtopic',
                    jms_subtopic: 'subtopic',
                    number: 4,
                    misc: 'other stuff'                };

                sessionService.setHistoricalSession(model);
            });

            it('notifies topic with active session', function () {
                expect(sessionHistoricalTopic.notify).toHaveBeenCalledWith(model);
                expect(sessionService.notifyUserOfHistoricalSessionChange).toHaveBeenCalledWith(model);
            });
        });

        describe('getTopicsWithSession', function () {
            var topicsWithSession;

            beforeEach(function (done) {
                dataTable.read.and.returnValue(Promise.resolve([
                    {
                        number: 1220,
                        topic: 'ampcs.vista.testbed.peterr.abcd',
                        jms_subtopic: 'abcd'
                    },
                    {
                        number: 1244,
                        topic: 'ampcs.vista.testbed.peterr.abcd',
                        jms_subtopic: 'abcd'
                    },
                    {
                        number: 1382,
                        topic: 'ampcs.vista.testbed.dsanto.abcd',
                        jms_subtopic: 'abcd'
                    },
                    {
                        number: 1393,
                        topic: 'ampcs.vista.testbed.dsanto.abcd',
                        jms_subtopic: 'abcd'
                    },
                    {
                        number: '',
                        topic: 'ampcs.vista.testbed.incoming.abcd',
                        jms_subtopic: 'abcd'
                    }
                ]));

                sessionService.getTopicsWithSessions()
                    .then(function (topics) {
                        topicsWithSession = topics;
                        done();
                    });
            });

            it('gets available topics with sessions for all datasets', function () {
                expect(mcws.dataTable)
                    .toHaveBeenCalledWith('/some/session/url');
                expect(mcws.dataTable)
                    .toHaveBeenCalledWith('/some/other/session/url');
            });

            it('does not make multiple calls for same topics with sessions for all datasets', function () {
                const count = Object.keys(datasetCache.datasets).length
                expect(count)
                    .toBe(5);
                expect(mcws.dataTable)
                    .toHaveBeenCalledTimes(2);
            });

            it('groups sessions by topic', function () {
                // expect 3x each dataset with unique sessionLADUrl
                expect(topicsWithSession.length).toBe(6);
                expect(topicsWithSession).toContain({
                    topic: 'ampcs.vista.testbed.peterr.abcd',
                    jms_subtopic: 'abcd',
                    sessions: [
                        {
                            topic: 'ampcs.vista.testbed.peterr.abcd',
                            jms_subtopic: 'abcd',
                            number: 1220
                        },
                        {
                            topic: 'ampcs.vista.testbed.peterr.abcd',
                            jms_subtopic: 'abcd',
                            number: 1244
                        }
                    ]
                });

                expect(topicsWithSession).toContain({
                    topic: 'ampcs.vista.testbed.dsanto.abcd',
                    jms_subtopic: 'abcd',
                    sessions: [
                        {
                            topic: 'ampcs.vista.testbed.dsanto.abcd',
                            jms_subtopic: 'abcd',
                            number: 1382
                        },
                        {
                            topic: 'ampcs.vista.testbed.dsanto.abcd',
                            jms_subtopic: 'abcd',
                            number: 1393
                        }
                    ]
                });

                expect(topicsWithSession).toContain({
                    topic: 'ampcs.vista.testbed.incoming.abcd',
                    jms_subtopic: 'abcd',
                    sessions: []
                });
            });
        });

        describe('getTopicsWithSession', function () {
            let historicalSessions;

            beforeEach(function (done) {
                dataTable.read.and.returnValue(Promise.resolve([
                    {
                        number: 1220,
                        topic: 'ampcs.vista.testbed.peterr.abcd',
                        jms_subtopic: 'abcd'
                    },
                    {
                        number: 1244,
                        topic: 'ampcs.vista.testbed.peterr.abcd',
                        jms_subtopic: 'abcd'
                    },
                    {
                        number: 1382,
                        topic: 'ampcs.vista.testbed.dsanto.abcd',
                        jms_subtopic: 'abcd'
                    },
                    {
                        number: 1393,
                        topic: 'ampcs.vista.testbed.dsanto.abcd',
                        jms_subtopic: 'abcd'
                    },
                    {
                        number: '',
                        topic: 'ampcs.vista.testbed.incoming.abcd',
                        jms_subtopic: 'abcd'
                    }
                ]));

                sessionService.getHistoricalSessions({})
                    .then(function(sessions) {
                        historicalSessions = sessions;
                        done();
                    });
            });

            it('gets available historical sessions for all datasets', function () {
                expect(mcws.dataTable)
                    .toHaveBeenCalledWith('/some/historical/session/url');
                expect(mcws.dataTable)
                    .toHaveBeenCalledWith('/some/other/historical/session/url');
            });

            it('does not make multiple calls for same topics with sessions for all datasets', function () {
                const count = Object.keys(datasetCache.datasets).length
                expect(count)
                    .toBe(5);
                expect(mcws.dataTable)
                    .toHaveBeenCalledTimes(2);
            });
        });
    });
});
