/**
 * Development mock of the mcws-proxy-api session and command endpoints.
 *
 * Serves a built Open MCT instance directory and answers the subset of
 * /api/v1 that the Session Control and Immediate Command views call, with
 * in-memory state. Use it to exercise the plugin UI before the real proxy
 * exists, and as an executable sketch of the contract the real proxy must
 * honor. It does not talk to AMPCS.
 *
 * Usage:
 *   ROOT=/path/to/openmct-build/instances/<name> node fake-proxy-server.mjs [port]
 *   GET /api/v1/__log returns every API request received, for test assertions.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = process.env.ROOT;
const port = Number(process.argv[2] || process.env.PORT || 18620);
if (!root || !fs.existsSync(root)) {
  console.error('Set ROOT to a built Open MCT instance directory.');
  process.exit(1);
}
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};
const state = { nextId: 30, commandSessions: [], downlinkSessions: [] };
const log = [];

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(body === undefined ? '' : JSON.stringify(body));
}

function api(req, res, route, body) {
  const now = new Date().toISOString();
  let match;

  if (req.method === 'GET' && route === '/sessions/active') return send(res, 200, []);
  if (req.method === 'GET' && route === '/command-sessions')
    return send(res, 200, state.commandSessions);
  if (req.method === 'POST' && route === '/command-sessions') {
    if (Array.isArray(body.sessionIds) && body.sessionIds.length > 0) {
      body.sessionIds.forEach((sessionId) =>
        state.commandSessions.push({ sessionId, startTime: now, parameters: {} })
      );
      return send(res, 200, { sessionIds: body.sessionIds, startTime: now });
    }
    const sessionId = state.nextId++;
    state.commandSessions.push({
      sessionId,
      startTime: now,
      parameters: body.parameters || {},
      topic: 'mpcs.dev.fake'
    });
    return send(res, 200, { sessionIds: [sessionId], startTime: now });
  }
  if (req.method === 'DELETE' && (match = route.match(/^\/command-sessions\/(\d+)$/))) {
    state.commandSessions = state.commandSessions.filter((s) => s.sessionId !== Number(match[1]));
    return send(res, 204);
  }
  if (req.method === 'GET' && route === '/downlink-sessions')
    return send(res, 200, state.downlinkSessions);
  if (req.method === 'POST' && route === '/downlink-sessions') {
    const parameters = body.parameters || {};
    const clash = state.downlinkSessions.find(
      (s) =>
        s.parameters.fswDownlinkHost === parameters.fswDownlinkHost &&
        s.parameters.fswDownlinkPort === parameters.fswDownlinkPort
    );
    if (clash) return send(res, 409, { message: `port in use by session ${clash.sessionId}` });
    const session = { sessionId: state.nextId++, startTime: now, parameters, state: 'ACTIVE' };
    state.downlinkSessions.push(session);
    return send(res, 200, [session]);
  }
  if (req.method === 'DELETE' && (match = route.match(/^\/downlink-sessions\/(\d+)$/))) {
    state.downlinkSessions = state.downlinkSessions.filter((s) => s.sessionId !== Number(match[1]));
    return send(res, 204);
  }
  if (req.method === 'POST' && route.startsWith('/commands/')) {
    return send(res, 200, {
      commandId: `cmd-${log.length}`,
      requested: body.commandString || body.commandStem,
      dispatchTime: now
    });
  }
  if (req.method === 'GET' && route === '/__log') return send(res, 200, log);
  return send(res, 404, { message: `no fake route for ${req.method} ${route}` });
}

http
  .createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/v1/')) {
      let raw = '';
      req.on('data', (chunk) => (raw += chunk));
      req.on('end', () => {
        const route = url.pathname.slice('/api/v1'.length);
        let body = {};
        try {
          body = raw ? JSON.parse(raw) : {};
        } catch {
          body = { raw };
        }
        if (route !== '/__log')
          log.push({ method: req.method, route, body: raw ? body : undefined });
        api(req, res, route, body);
      });
      return;
    }
    let file = path.join(root, decodeURIComponent(url.pathname));
    if (file.endsWith('/')) file = path.join(file, 'index.html');
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, '127.0.0.1', () =>
    console.log(`fake proxy serving ${root} on http://127.0.0.1:${port}`)
  );
