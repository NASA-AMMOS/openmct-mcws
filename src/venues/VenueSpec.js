import SessionService from 'services/session/SessionService';
import Venue from './Venue';

describe('Venue', () => {
  let configuration;
  let sessionService;
  let venue;
  let openmct;

  beforeEach(() => {
    configuration = {
      name: 'EXAMPLE A',
      host: 'host',
      prefix: 'some prefix',
      mcwsRootUrl: '/mcws',
      channelDictionaryUrl: '/qdb/ChannelDictionary',
      channelEnumerationDictionaryUrl: '/qdb/ChannelEnumerationDictionary',
      channelHistoricalUrl: '/qdb/Channel',
      channelMinMaxUrl: '/lom/ChannelMinMax',
      channelLADUrl: '/lad/Channel',
      channelStreamUrl: 'wss://host/mcws/stream/Channel',
      sessionUrl: '/qdb/Session',
      sessionLADUrl: '/lad/Session',
      eventRecordDictionaryUrl: '/qdb/EventRecordDictionary',
      evrHistoricalUrl: '/qdb/EventRecord',
      evrStreamUrl: 'wss://host/mcws/stream/EventRecord',
      dataProductUrl: '/qdb/DataProduct',
      dataProductContentUrl: '/qdb/DataProductContent',
      dataProductStreamUrl: 'wss://host/mcws/stream/DataProduct',
      packetUrl: '/qdb/Packet',
      packetContentUrl: '/qdb/PacketContent',
      packetSummaryEventStreamUrl: 'wss://host/mcws/stream/PacketSummaryEvent',
      commandEventUrl: '/qdb/CommandEvent',
      commandEventStreamUrl: 'wss://host/mcws/stream/CommandEvent'
    };
    openmct = jasmine.createSpyObj('openmct', ['on']);
    openmct.on.and.returnValue(Promise.resolve());
    sessionService = new SessionService(openmct, {
      sessions: {
        historicalSessionFilter: {
          disable: false,
          maxRecords: 1000
        },
        realtimeSession: {
          disable: false
        }
      }
    });
    sessionService = jasmine.createSpyObj('sessionService', ['getActiveSessions']);
    venue = new Venue(configuration);
    venue.sessionService = sessionService;
  });

  it('has a host', () => {
    expect(venue.host).toBe(configuration.host);
  });

  it('returns a domain object', () => {
    const domainObject = venue.getdomainObject();
    expect(domainObject.name).toBe(`${configuration.name} Dataset`);
    expect(domainObject.host).not.toBeDefined();
    expect(domainObject.prefix).toBe(configuration.prefix);
    expect(domainObject.mcwsRootUrl).toBe(configuration.mcwsRootUrl);
    expect(domainObject.channelDictionaryUrl).toBe(configuration.channelDictionaryUrl);
    expect(domainObject.channelEnumerationDictionaryUrl).toBe(
      configuration.channelEnumerationDictionaryUrl
    );
    expect(domainObject.channelHistoricalUrl).toBe(configuration.channelHistoricalUrl);
    expect(domainObject.channelMinMaxUrl).toBe(configuration.channelMinMaxUrl);
    expect(domainObject.channelLADUrl).toBe(configuration.channelLADUrl);
    expect(domainObject.channelStreamUrl).toBe(configuration.channelStreamUrl);
    expect(domainObject.sessionUrl).toBe(configuration.sessionUrl);
    expect(domainObject.sessionLADUrl).toBe(configuration.sessionLADUrl);
    expect(domainObject.eventRecordDictionaryUrl).toBe(configuration.eventRecordDictionaryUrl);
    expect(domainObject.evrHistoricalUrl).toBe(configuration.evrHistoricalUrl);
    expect(domainObject.evrStreamUrl).toBe(configuration.evrStreamUrl);
    expect(domainObject.dataProductUrl).toBe(configuration.dataProductUrl);
    expect(domainObject.dataProductContentUrl).toBe(configuration.dataProductContentUrl);
    expect(domainObject.dataProductStreamUrl).toBe(configuration.dataProductStreamUrl);
    expect(domainObject.packetUrl).toBe(configuration.packetUrl);
    expect(domainObject.packetContentUrl).toBe(configuration.packetContentUrl);
    expect(domainObject.packetSummaryEventStreamUrl).toBe(
      configuration.packetSummaryEventStreamUrl
    );
    expect(domainObject.commandEventUrl).toBe(configuration.commandEventUrl);
    expect(domainObject.commandEventStreamUrl).toBe(configuration.commandEventStreamUrl);
  });

  it('allows realtime', () => {
    expect(venue.allowsRealtime()).toBe(true);
  });

  it('can get active sessions', () => {
    const sessionResponse = {};
    sessionService.getActiveSessions.and.returnValue(sessionResponse);
    const sessions = venue.getActiveSessions();
    expect(sessions).toBe(sessionResponse);
  });
});
