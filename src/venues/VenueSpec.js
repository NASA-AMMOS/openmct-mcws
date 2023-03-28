define([
    './Venue'
], function(
    Venue
) {

    describe('Venue', function () {
        var configuration;
        var sessionService;
        var openmct;
        var venue;

        beforeEach(function () {
            configuration = {
                "name": "EXAMPLE A",
                "host": "host",
                "prefix": "some prefix",
                "mcwsRootUrl": "/mcws",
                "channelDictionaryUrl": "/qdb/ChannelDictionary",
                "channelEnumerationDictionaryUrl": "/qdb/ChannelEnumerationDictionary",
                "channelHistoricalUrl": "/qdb/Channel",
                "channelMinMaxUrl": "/lom/ChannelMinMax",
                "channelLADUrl": "/lad/Channel",
                "channelStreamUrl": "wss://host/mcws/stream/Channel",
                "sessionUrl": "/qdb/Session",
                "sessionLADUrl": "/lad/Session",
                "eventRecordDictionaryUrl": "/qdb/EventRecordDictionary",
                "evrHistoricalUrl": "/qdb/EventRecord",
                "evrStreamUrl": "wss://host/mcws/stream/EventRecord",
                "dataProductUrl": "/qdb/DataProduct",
                "dataProductContentUrl": "/qdb/DataProductContent",
                "dataProductStreamUrl": "wss://host/mcws/stream/DataProduct",
                "packetUrl": "/qdb/Packet",
                "packetContentUrl": "/qdb/PacketContent",
                "packetSummaryEventStreamUrl": "wss://host/mcws/stream/PacketSummaryEvent",
                "commandEventUrl": "/qdb/CommandEvent",
                "commandEventStreamUrl": "wss://host/mcws/stream/CommandEvent"
            };
            openmct = {
                $injector: jasmine.createSpyObj('$injector', ['get'])
            };
            sessionService = jasmine.createSpyObj('sessionService', [
                'getActiveSessions'
            ]);
            openmct.$injector.get.and.callFake(function (dependency) {
                expect(dependency).toBe('vista.sessions');
                return sessionService;
            });
            venue = new Venue(configuration, openmct);
        });

        it('has a host', function () {
            expect(venue.host).toBe('host');
        });

        it('returns a model', function () {
            var model = venue.getModel();
            expect(model.name).toBe('EXAMPLE A Dataset');
            expect(model.host).not.toBeDefined();
            expect(model.prefix).toBe("some prefix");
            expect(model.mcwsRootUrl).toBe("/mcws");
            expect(model.channelDictionaryUrl).toBe("/qdb/ChannelDictionary");
            expect(model.channelEnumerationDictionaryUrl).toBe("/qdb/ChannelEnumerationDictionary");
            expect(model.channelHistoricalUrl).toBe("/qdb/Channel");
            expect(model.channelMinMaxUrl).toBe("/lom/ChannelMinMax");
            expect(model.channelLADUrl).toBe("/lad/Channel");
            expect(model.channelStreamUrl).toBe("wss://host/mcws/stream/Channel");
            expect(model.sessionUrl).toBe("/qdb/Session");
            expect(model.sessionLADUrl).toBe("/lad/Session");
            expect(model.eventRecordDictionaryUrl).toBe("/qdb/EventRecordDictionary");
            expect(model.evrHistoricalUrl).toBe("/qdb/EventRecord");
            expect(model.evrStreamUrl).toBe("wss://host/mcws/stream/EventRecord");
            expect(model.dataProductUrl).toBe("/qdb/DataProduct");
            expect(model.dataProductContentUrl).toBe("/qdb/DataProductContent");
            expect(model.dataProductStreamUrl).toBe("wss://host/mcws/stream/DataProduct");
            expect(model.packetUrl).toBe("/qdb/Packet");
            expect(model.packetContentUrl).toBe("/qdb/PacketContent");
            expect(model.packetSummaryEventStreamUrl).toBe("wss://host/mcws/stream/PacketSummaryEvent");
            expect(model.commandEventUrl).toBe("/qdb/CommandEvent");
            expect(model.commandEventStreamUrl).toBe("wss://host/mcws/stream/CommandEvent");
        });

        it('allows realtime', function () {
            expect(venue.allowsRealtime()).toBe(true);
        });

        it('can get active sessions', function () {
            var sessionResponse = {};
            sessionService.getActiveSessions.and.returnValue(sessionResponse);
            var sessions = venue.getActiveSessions();
            expect(sessions).toBe(sessionResponse);
        });
    });
});
