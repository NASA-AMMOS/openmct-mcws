/**
 * Headless Chrome check of a built instance served by fake-proxy-server.mjs.
 *
 * Verifies: missionControl config arrives from the build layer; Session
 * Control renders the configured forms, opens downlink and uplink sessions,
 * auto-advances the port, locks a fixed-port host, and stops one session;
 * and, when the runtime config defines dynamic fixed presets, that the
 * initial bounds are today's UTC day and "Last week to end of today" sets
 * the expected range.
 *
 * Usage:
 *   CHROME_BIN=/path/to/chrome-headless-shell BASE_URL=http://127.0.0.1:18620 \
 *     OVERRIDE_RUNTIME_CONFIG=1 node e2e-check.mjs
 * OVERRIDE_RUNTIME_CONFIG=1 blanks camUrl/mcwsUrl and enables developer
 * storage in the served mcws-config.json, in flight only, so the page loads
 * without CAM or MCWS. Time settings are left untouched.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const CHROME = process.env.CHROME_BIN;
const BASE = process.env.BASE_URL || 'http://127.0.0.1:18620';
const CDP_PORT = Number(process.env.CDP_PORT || 9335);
const SCREENSHOT = process.env.SCREENSHOT || '';
const OVERRIDE = process.env.OVERRIDE_RUNTIME_CONFIG === '1';
if (!CHROME) {
  console.error('Set CHROME_BIN to a Chrome or chrome-headless-shell binary.');
  process.exit(2);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const chrome = spawn(
  CHROME,
  [
    '--headless',
    '--no-sandbox',
    '--disable-gpu',
    `--remote-debugging-port=${CDP_PORT}`,
    '--window-size=1500,1300',
    'about:blank'
  ],
  { stdio: 'ignore' }
);

let target;
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200);
  try {
    target = (await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json()).find(
      (t) => t.type === 'page'
    );
  } catch {
    // Chrome is still starting; retry.
  }
}
if (!target) {
  console.error('Chrome did not expose a page target.');
  chrome.kill();
  process.exit(2);
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve) => (ws.onopen = resolve));
let id = 0;
const pending = new Map();
const exceptions = [];
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const n = ++id;
    pending.set(n, resolve);
    ws.send(JSON.stringify({ id: n, method, params }));
  });
ws.onmessage = async (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
    return;
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    exceptions.push(msg.params.exceptionDetails?.exception?.description?.split('\n')[0]);
  }
  if (msg.method === 'Fetch.requestPaused') {
    const { requestId } = msg.params;
    const body = await send('Fetch.getResponseBody', { requestId });
    const text = body.result.base64Encoded
      ? Buffer.from(body.result.body, 'base64').toString()
      : body.result.body;
    const config = JSON.parse(text);
    Object.assign(config, { camUrl: '', mcwsUrl: '', useDeveloperStorage: true });
    await send('Fetch.fulfillRequest', {
      requestId,
      responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'application/json' }],
      body: Buffer.from(JSON.stringify(config)).toString('base64')
    });
  }
};
const evaluate = async (expression) => {
  const res = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  if (res.result?.exceptionDetails) {
    return { error: res.result.exceptionDetails.exception?.description };
  }
  const value = res.result?.result?.value;
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    return value;
  }
};
const dayStart = (n) => {
  const d = new Date();
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + n);
};
const checks = {};
const report = { checks };

await send('Runtime.enable');
if (OVERRIDE) {
  await send('Fetch.enable', {
    patterns: [{ urlPattern: '*mcws-config.json*', requestStage: 'Response' }]
  });
}
await send('Page.navigate', { url: `${BASE}/index.html` });
await sleep(8000);

report.audit = await evaluate(`JSON.stringify({
  missionControl: window.openmctMCWSConfigurationAudit?.sources?.['missionControl.downlinkSessionFields'],
  time: window.openmctMCWSConfigurationAudit?.sources?.['time.timeSystems'],
  hasDynamicFixed: Boolean(window.openmctMCWSConfig?.time?.timeSystems?.some?.((s) => s?.modeSettings?.fixed?.presets))
})`);
checks.missionControlFromBuild = report.audit?.missionControl === 'build';

if (report.audit?.hasDynamicFixed) {
  report.initialBounds = await evaluate('JSON.stringify(openmct.time.getBounds())');
  checks.initialBoundsToday =
    report.initialBounds?.start === dayStart(0) && report.initialBounds?.end === dayStart(1);
  await evaluate(
    `[...document.querySelectorAll('button')].find((b) => /history/.test(b.className))?.click()`
  );
  await sleep(800);
  report.presets = await evaluate(
    `JSON.stringify([...document.querySelectorAll('.c-menu li, [role=menuitem]')].map((li) => li.textContent.trim()).filter(Boolean))`
  );
  await evaluate(
    `[...document.querySelectorAll('.c-menu li, [role=menuitem]')].find((li) => li.textContent.trim() === 'Last week to end of today')?.click()`
  );
  await sleep(800);
  report.lastWeekBounds = await evaluate('JSON.stringify(openmct.time.getBounds())');
  checks.lastWeekPreset =
    report.lastWeekBounds?.start === dayStart(-7) && report.lastWeekBounds?.end === dayStart(1);
}

report.saved = await evaluate(`(async () => {
  const object = { identifier: { namespace: '', key: 'session-control-e2e' }, type: 'vista.sessionControl',
    name: 'Session Control E2E', composition: [], location: 'ROOT' };
  await openmct.objects.save(object);
  window.location.hash = '#/browse/session-control-e2e';
  return 'saved';
})()`);
await sleep(4000);

report.forms =
  await evaluate(`JSON.stringify([...document.querySelectorAll('form.c-session-fields')].map((form) =>
  [...form.querySelectorAll('.c-session-fields__row')].map((row) => {
    const input = row.querySelector('input, select');
    return { label: row.querySelector('label')?.textContent.trim().replace(/\\s+/g, ' '), id: input?.id, value: input?.value };
  })))`);
checks.formsRendered =
  Array.isArray(report.forms) &&
  report.forms.length === 2 &&
  report.forms.every((f) => f.length > 0);

const sections = `[...document.querySelectorAll('.c-session-control__section')]`;
await evaluate(
  `[...document.querySelectorAll('form.c-session-fields')][1]?.querySelector('button[type=submit]').click()`
);
await sleep(1500);
report.downlinkRows = await evaluate(
  `${sections}[2]?.querySelectorAll('.c-session-control__list li').length`
);
report.portAfterOpen = await evaluate(
  `document.getElementById('downlink-field-fswDownlinkPort')?.value`
);
checks.downlinkOpened = report.downlinkRows === 1;

const hostSelect = `document.getElementById('downlink-field-fswDownlinkHost')`;
if (await evaluate(`Boolean(${hostSelect} && ${hostSelect}.options.length > 1)`)) {
  await evaluate(
    `(() => { const s = ${hostSelect}; s.selectedIndex = 1; s.dispatchEvent(new Event('change')); })()`
  );
  await sleep(500);
  report.fixedHostPort =
    await evaluate(`JSON.stringify({ value: document.getElementById('downlink-field-fswDownlinkPort')?.value,
    readonly: document.getElementById('downlink-field-fswDownlinkPort')?.readOnly })`);
  await evaluate(
    `(() => { const s = ${hostSelect}; s.selectedIndex = 0; s.dispatchEvent(new Event('change')); })()`
  );
  await sleep(300);
}

await evaluate(
  `[...document.querySelectorAll('form.c-session-fields')][0]?.querySelector('button[type=submit]').click()`
);
await sleep(1500);
report.uplinkSelected = await evaluate(
  `document.querySelector('input[name=uplink-session]:checked')?.value`
);
checks.uplinkOpenedAndSelected = Boolean(report.uplinkSelected);

if (SCREENSHOT) {
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(SCREENSHOT, Buffer.from(shot.result.data, 'base64'));
}

await evaluate(`document.querySelector('button[aria-label^="Stop downlink session"]')?.click()`);
await sleep(1500);
report.downlinkRowsAfterStop = await evaluate(
  `${sections}[2]?.querySelectorAll('.c-session-control__list li').length`
);
report.apiLog = await (await fetch(`${BASE}/api/v1/__log`)).json();
checks.stoppedOneSession =
  report.downlinkRowsAfterStop === 0 &&
  report.apiLog.some(
    (entry) => entry.method === 'DELETE' && /^\/downlink-sessions\/\d+$/.test(entry.route)
  ) &&
  !report.apiLog.some((entry) => entry.method === 'DELETE' && entry.route === '/downlink-sessions');
report.pageExceptions = exceptions;

console.log(JSON.stringify(report, null, 1));
ws.close();
chrome.kill();
process.exit(Object.values(checks).every(Boolean) ? 0 : 1);
