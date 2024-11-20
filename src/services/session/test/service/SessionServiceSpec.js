import SessionService from '../../SessionService';
import mcws from '../../../../services/mcws/mcws';
 
describe('SessionService', () => {
    let dataTable;
    let datasetCache;
    let openmct;
    let sessionService;

    beforeEach(() => {
        spyOn(mcws, 'dataTable');
        
        dataTable = jasmine.createSpyObj(
            'dataTable',
            ['read']
        );

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
                'objectViews',
                'notifications',
                'on'
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
        openmct.on.and.returnValue(Promise.resolve());
        
        openmct.notifications = jasmine.createSpyObj('notificationApi',
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

        sessionService = new SessionService(openmct, openmctMCWSConfig);

        spyOn(sessionService, 'listen').and.callThrough();
        spyOn(sessionService, 'listenForHistoricalChange').and.callThrough();
        spyOn(sessionService, 'getDatasets').and.returnValue(datasetCache.datasets);
        sessionService.notifyUserOfHistoricalSessionFilterChange = jasmine.createSpy('notifyUserOfHistoricalSessionFilterChange');
    });

    afterEach(() => {
        sessionService.setActiveTopicOrSession(undefined);
    });

    it('initially has no active topic', () => {
        expect(sessionService.getActiveTopicOrSession()).toBeUndefined();
        expect(sessionService.hasActiveTopicOrSession()).toBe(false);
    });

    it('provides a helper method to listen for changes', () => {
        let callback = jasmine.createSpy('callback');
        const model = {};

        sessionService.listen(callback);
        expect(sessionService.listen).toHaveBeenCalledWith(callback);

        sessionService.setActiveTopicOrSession(model);
        expect(callback).toHaveBeenCalledWith(model);
    });

    it('provides a helper method to listen for historical changes', () => {
        let callback = jasmine.createSpy('callback');
        const model = {};

        sessionService.listenForHistoricalChange(callback);
        expect(sessionService.listenForHistoricalChange).toHaveBeenCalledWith(callback);

        sessionService.setHistoricalSessionFilter(model);
        expect(callback).toHaveBeenCalledWith(model);
    });

    describe('with an active topic/session', () => {
        let activeModel;
        let callback;

        beforeEach(() => {
            callback = jasmine.createSpy('callback');
            activeModel = {
                topic: 'my.topic.subtopic',
                jms_subtopic: 'subtopic',
                number: 4,
                misc: 'other stuff'
            };
            sessionService.listen(callback);
            sessionService.setActiveTopicOrSession(activeModel);
        });

        it('has an active model', () => {
            expect(sessionService.hasActiveTopicOrSession()).toBe(true);
            expect(sessionService.isActiveTopic(activeModel)).toBe(true);
            expect(sessionService.isActiveSession(activeModel)).toBe(true);
            expect(sessionService.getActiveTopicOrSession()).toEqual(activeModel);
        });

        it('does not differentiate via exact equality', () => {
            // Important because getTopicsWithSessions returns new topic/session objects.
            const copyModel = JSON.parse(JSON.stringify(activeModel));

            expect(copyModel).not.toBe(activeModel);
            expect(sessionService.isActiveTopic(copyModel)).toBe(true);
            expect(sessionService.isActiveSession(copyModel)).toBe(true);
        });

        it('notifies topic with active session', () => {
            const connectionMessage = `Connected to realtime from ${activeModel.topic}`;

            expect(callback).toHaveBeenCalledWith(activeModel);
            expect(sessionService.notificationService.info).toHaveBeenCalledWith(connectionMessage);
        });

        it('does not notify if the same model is selected', () => {
            expect(callback).toHaveBeenCalledTimes(1);
            const copyModel = JSON.parse(JSON.stringify(activeModel));

            sessionService.setActiveTopicOrSession(activeModel);
            sessionService.setActiveTopicOrSession(copyModel);
            sessionService.setActiveTopicOrSession(activeModel);
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('notifies if the active model is cleared ', () => {
            expect(callback).toHaveBeenCalledTimes(1);
            sessionService.setActiveTopicOrSession(undefined);
            expect(callback).toHaveBeenCalledWith(undefined);
            expect(callback).toHaveBeenCalledTimes(2);
        });
        
        it('does not match with different topic', () => {
            const copyModel = JSON.parse(JSON.stringify(activeModel));
            copyModel.topic = copyModel.topic + 1234;

            expect(sessionService.isActiveTopic(copyModel)).toBe(false);
            expect(sessionService.isActiveSession(copyModel)).toBe(false);

        });

        it('does not match with different number', () => {
            const copyModel = JSON.parse(JSON.stringify(activeModel));
            copyModel.number = copyModel.number + 1234;

            expect(sessionService.isActiveTopic(copyModel)).toBe(true);
            expect(sessionService.isActiveSession(copyModel)).toBe(false);
        });

        ['topic', 'number'].forEach((key) => {
            it(`notifies on ${key === 'topic' ? key : 'session'} change`, () => {
                expect(callback).toHaveBeenCalledTimes(1);
                const copyModel = JSON.parse(JSON.stringify(activeModel));

                copyModel[key] = copyModel[key] + 1234;
                expect(copyModel[key]).not.toBe(activeModel[key]);
                sessionService.setActiveTopicOrSession(copyModel);
                expect(callback).toHaveBeenCalledTimes(2);
            });
        });
    });

    describe('with an active historical session', () => {
        let model;
        let callback;

        beforeEach(() => {
            callback = jasmine.createSpy('callback');
            model = {
                topic: 'my.topic.subtopic',
                jms_subtopic: 'subtopic',
                number: 4,
                misc: 'other stuff'                };

            sessionService.listenForHistoricalChange(callback);
            sessionService.setHistoricalSessionFilter(model);
        });

        it('notifies topic with active session', () => {
            expect(callback).toHaveBeenCalledWith(model);
            expect(sessionService.notifyUserOfHistoricalSessionFilterChange).toHaveBeenCalledWith(model);
        });
    });

    describe('getTopicsWithSession', () => {
        let topicsWithSession;

        beforeEach(async () => {
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

            topicsWithSession = await sessionService.getTopicsWithSessions();
        });

        it('gets available topics with sessions for all datasets', () => {
            expect(mcws.dataTable).toHaveBeenCalledWith('/some/session/url');
            expect(mcws.dataTable).toHaveBeenCalledWith('/some/other/session/url');
        });

        it('does not make multiple calls for same topics with sessions for all datasets', () => {
            const count = Object.keys(datasetCache.datasets).length;

            expect(count).toBe(5);
            expect(mcws.dataTable).toHaveBeenCalledTimes(2);
        });

        it('groups sessions by topic', () => {
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

    describe('getTopicsWithSession', () => {
        let historicalSessions;

        beforeEach(async () => {
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

            historicalSessions = await sessionService.getHistoricalSessions({});
        });

        it('gets available historical sessions for all datasets', () => {
            expect(mcws.dataTable).toHaveBeenCalledWith('/some/historical/session/url');
            expect(mcws.dataTable).toHaveBeenCalledWith('/some/other/historical/session/url');
        });

        it('does not make multiple calls for same topics with sessions for all datasets', () => {
            const count = Object.keys(datasetCache.datasets).length
            expect(count).toBe(5);
            expect(mcws.dataTable).toHaveBeenCalledTimes(2);
        });
    });
});
