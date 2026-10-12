import {
  commandEventFilter,
  openCommandEventStream,
  parseFrame,
  toWebSocketUrl
} from './commandEventStream.js';

describe('commandEventStream', () => {
  const location = { href: 'https://ops.example.com/openmct/index.html' };

  it('resolves stream URLs to websocket URLs', () => {
    expect(toWebSocketUrl('wss://mcws.example.com/cmd', location)).toBe(
      'wss://mcws.example.com/cmd'
    );
    expect(toWebSocketUrl('/mcws/streams/command-events', location)).toBe(
      'wss://ops.example.com/mcws/streams/command-events'
    );
    expect(toWebSocketUrl('./api/v1/streams/command-events', location)).toBe(
      'wss://ops.example.com/openmct/api/v1/streams/command-events'
    );
    expect(toWebSocketUrl('//other.example.com/cmd', { href: 'http://a.example.com/' })).toBe(
      'ws://other.example.com/cmd'
    );
    expect(toWebSocketUrl('', location)).toBe(null);
  });

  it('builds the session filter in stream worker form', () => {
    expect(commandEventFilter({ sessionId: 21, topic: 'mpcs.generic.host.user' })).toBe(
      '(session_id=21,topic=mpcs.generic.host.user)'
    );
    expect(commandEventFilter({ sessionId: 21 })).toBe('(session_id=21)');
  });

  it('accepts array frames, single-row frames, and ignores heartbeats', () => {
    expect(parseFrame('[{"status":"Radiated"},null]')).toEqual([{ status: 'Radiated' }]);
    expect(parseFrame('{"status":"Radiated"}')).toEqual([{ status: 'Radiated' }]);
    expect(parseFrame('ping')).toEqual([]);
  });

  describe('openCommandEventStream', () => {
    let sockets;
    let FakeWebSocket;

    beforeEach(() => {
      jasmine.clock().install();
      sockets = [];
      FakeWebSocket = class {
        constructor(url) {
          this.url = url;
          this.closed = false;
          sockets.push(this);
        }

        close() {
          this.closed = true;
        }
      };
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('delivers rows, reconnects after a drop, and stops when closed', () => {
      const received = [];
      const states = [];
      const stream = openCommandEventStream({
        url: '/mcws/cmd',
        sessionId: 21,
        onRows: (rows) => received.push(...rows),
        onStateChange: (state) => states.push(state),
        WebSocketImpl: FakeWebSocket,
        reconnectDelays: [100],
        location
      });

      expect(sockets[0].url).toBe('wss://ops.example.com/mcws/cmd?filter=(session_id=21)');
      sockets[0].onopen();
      sockets[0].onmessage({ data: '[{"status":"Radiated"}]' });
      expect(received).toEqual([{ status: 'Radiated' }]);

      sockets[0].onclose();
      jasmine.clock().tick(100);
      expect(sockets.length).toBe(2);

      stream.close();
      expect(sockets[1].closed).toBe(true);
      jasmine.clock().tick(1000);
      expect(sockets.length).toBe(2);
      expect(states).toEqual(['connecting', 'connected', 'disconnected', 'connecting', 'closed']);
    });
  });
});
