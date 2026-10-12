const DEFAULT_RECONNECT_DELAYS = [2000, 5000, 10000, 30000];

/**
 * Resolves a configured stream URL (absolute ws/wss/http/https,
 * protocol-relative, host-relative, or relative) to a ws/wss URL.
 */
export function toWebSocketUrl(url, location = window.location) {
  if (!url) {
    return null;
  }

  if (/^wss?:\/\//i.test(url)) {
    return url;
  }

  const absolute = new URL(url, location.href);

  absolute.protocol = absolute.protocol === 'https:' ? 'wss:' : 'ws:';

  return absolute.toString();
}

/**
 * MCWS stream filter for one session, in the same form the realtime
 * stream worker sends.
 */
export function commandEventFilter({ sessionId, topic } = {}) {
  const terms = [];

  if (sessionId !== undefined && sessionId !== null && sessionId !== '') {
    terms.push(`session_id=${sessionId}`);
  }

  if (topic) {
    terms.push(`topic=${topic}`);
  }

  return `(${terms.join(',')})`;
}

/**
 * Stream frames are a JSON array of rows (MCWS) or a single row object;
 * both are accepted. Non-JSON frames, such as heartbeats, yield no rows.
 */
export function parseFrame(data) {
  let parsed;

  try {
    parsed = typeof data === 'string' ? JSON.parse(data) : data;
  } catch {
    return [];
  }

  const rows = Array.isArray(parsed) ? parsed : [parsed];

  return rows.filter((row) => row !== null && typeof row === 'object');
}

/**
 * Opens a command event stream for one session and reconnects with
 * backoff until closed.
 *
 * @returns {{ url: string, close: Function }}
 */
export function openCommandEventStream({
  url,
  sessionId,
  topic,
  onRows,
  onStateChange = () => {},
  WebSocketImpl = globalThis.WebSocket,
  reconnectDelays = DEFAULT_RECONNECT_DELAYS,
  location = window.location
}) {
  const base = toWebSocketUrl(url, location);
  const target = `${base}${base.includes('?') ? '&' : '?'}filter=${commandEventFilter({
    sessionId,
    topic
  })}`;
  let socket = null;
  let closed = false;
  let attempt = 0;
  let timer = null;

  function connect() {
    onStateChange('connecting');
    socket = new WebSocketImpl(target);

    socket.onopen = () => {
      attempt = 0;
      onStateChange('connected');
    };

    socket.onmessage = (event) => {
      const rows = parseFrame(event.data);

      if (rows.length > 0) {
        onRows(rows);
      }
    };

    socket.onclose = () => {
      if (closed) {
        return;
      }

      const delay = reconnectDelays[Math.min(attempt, reconnectDelays.length - 1)];

      attempt++;
      onStateChange('disconnected');
      timer = setTimeout(connect, delay);
    };
  }

  connect();

  return {
    url: target,
    close() {
      closed = true;
      clearTimeout(timer);

      if (socket) {
        socket.onclose = null;
        socket.onmessage = null;
        socket.close();
        socket = null;
      }

      onStateChange('closed');
    }
  };
}
