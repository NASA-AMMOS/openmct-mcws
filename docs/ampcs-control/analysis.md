<!-- cspell:words telem ingester worktree fswsse uplinkproxyserver downlinkproxyclient webdev openidc nohup asyncio Redocly mudinthewater MOCRT libwayland libgbm libdrm fastmio dockerized aiohttp -->

# AMPCS control through mcws-proxy-api: gap analysis and proposal

Date: 2026-10-12

Compared:

- **Current:** the local AMPCSController plugin (untracked `openmct-mcws/src/AMPCSController`)
  and the Python controller it drives (`fake_mcws/realtime`).
- **Target:** `feat-484-command-dictionary` at `c318b60`: `mcws-proxy-api/openapi.yaml` v0.11.0,
  `src/missionControl`, `src/sessionControl`, `src/immediateCommand`,
  `src/services/dataset/CommandDictionary.js`, and `src/realtime`.
  Checked out as a detached worktree at `/home/pasquale/OMM_BUILD/openmct-mcws-feat-484`.

Companion file: [`openapi-control-additions.yaml`](openapi-control-additions.yaml) holds the
proposed spec changes. Section 5 covers how it was validated.

## 0. Decisions and status (updated 2026-10-12)

Decisions from review:

- **Proxy location.** The proxy runs on the AMPCS host, so no agent link is needed.
- **Command sessions.** One long-lived uplink session is opened and reused, like downlink.
- **Delayed commands.** Delayed immediate commands are out of scope. feat-484 never had them, and none were added.
- **Session forms.** Session fields, option lists, and port ranges come from plugin config set in the instance YAML at build time. This replaces the proposed `GET /control/options`.
- **Stopping sessions.** Stop acts on one session only.
- **Radiation status.** Radiation status comes from the existing command event endpoints.
- **Stream frame shape.** This is dropped as not relevant.

Verified against the local AMPCS 9.0.0B2 install:

- **Opening an uplink session.** `chill_send_cmd` run with the session options and a comment-only command file creates an uplink session and sends nothing.
- **Reusing it.** Later sends with `--sessionKey <key>` reuse that session's dictionary, spacecraft IDs, and output directory, and create no new session. A parallel real send through a local listener was recorded under the reused session with status Radiated.
- **Session types.** AMPCS refuses uplink on a downlink-only session, and the ingester refuses an uplink-only session.
- **Downlink session IDs.** A caller cannot choose an arbitrary session number. `chill_telem_ingest` with its REST control client returns a new key from `createSession` immediately. `attach` then takes that key with the connection options, followed by `start`, `stop`, and `release`. `telem` and `perf` return health as JSON.
- **Argument syntax.** Quoted strings may contain commas. Repeat arguments are a count followed by the values, per the AMPCS parser source.

Implemented on local branch `feat-484-ampcs-session-control` in the `openmct-mcws-feat-484` worktree. Nothing is committed.

- **Spec v0.12.0.**
  - Sessions open from `parameters` or attach by `sessionIds`.
  - `DELETE /command-sessions/{sessionId}` and `DELETE /downlink-sessions/{sessionId}` replace the stop-all endpoints.
  - Command event fields used for radiation status are documented.
  - The AMPCS mapping is documented.
- **Plugin.**
  - The `missionControl` config drives the Session Control forms.
  - Each session has its own Stop.
  - The Immediate Command view shows radiation status from `/streams/command-events`, with a Check status query.
  - The argument encoding bugs and the dictionary spec are fixed.
  - The two upstream Linux build fixes are applied: PR 474 and `fix-472-vista-style-import`.

Still only a proposal, not implemented:

- The `/streams/control` push stream, idempotency keys, and the extended `CommandDispatch` in [`openapi-control-additions.yaml`](openapi-control-additions.yaml).
- That file predates these decisions. Its `/control/options`, session-start, and stop items are superseded by the spec on the branch.

## 1. Recommendation

1. **Keep HTTP for every action, including immediate commands.** The spec sends commands
   with POST, not PUT; PUT appears only in the persistence endpoints. POST is the right fit:
   each command gets its own correlated, authorized, auditable, retry-safe answer.
2. **Add one websocket, `GET /streams/control`, that only pushes events.** It carries
   session lifecycle, command results, downlink health, queue and transfer progress, and
   opt-in process logs. This push channel is the part of the AMPCSController websocket that
   the spec lacks.
3. **Close the AMPCS-specific contract gaps.** These are uplink session configuration,
   downlink session creation with connection parameters, per-session stop, server-published
   option lists, and a dispatch response that carries the outcome.
4. **The browser talks only to the proxy.** Retire the uplinkProxy and downlinkProxy
   websockets. If the proxy cannot reach the AMPCS host, keep an outbound agent websocket
   between the AMPCS host and the proxy, outside the browser contract.

This departs from the wording of note 4 in the request. Commands would not travel over the
websocket; it would carry every event instead. The browser still ends up with a single
control endpoint and no browser-side data proxies.

## 2. How the current system works

```
Browser: AMPCSController ──wss──► /controller (relay) ◄──wss── ampcs_controller_client.py
                                                                          │  (AMPCS host)
                                                                          ├─► chill_send_cmd  (one per command)
                                                                          └─► chill_down      (one per downlink session)
Browser ──wss──► /uplinkProxy, /downlinkProxy     (connected for status only; no data sent)
uplinkproxyserver.py:   tcp :9825 ─► wss /uplinkProxy
downlinkproxyclient.py: wss /downlinkProxy ─► tcp <session port>
```

| Behavior | Evidence | Consequence |
| --- | --- | --- |
| `/controller` is a relay. The browser and the Python controller both connect to it as clients. | `ampcs_controller_client.py` calls `websockets.connect`. The relay code is not in this workspace. | The AMPCS host needs only outbound access. This is the one property worth keeping (section 9). |
| Each command becomes `STEM,arg,...` and runs one `chill_send_cmd` with a single global uplink config. | `execute_command` | All browsers share one config. |
| Each command run creates a new AMPCS session and takes over a second. | The log shows 69 commands writing SCMFs under 69 distinct session directories. One run took 1.35 s from session start to "Forwarded". | Latency is dominated by the tool, not the transport. |
| A `config` message from any browser replaces the uplink config for every user. | `handle_config_message` | Operators can silently retarget each other. |
| Results return as untagged `output` text lines broadcast to all browsers. | `send_output_message` | Results cannot be tied to a request. No component subscribes to `output`, so users never see whether a command radiated. "Command History" only echoes what was sent. |
| chill_down stdout is relayed line by line. | 1,855,721 of 1,871,236 lines in the current `logs/ampcs_controller.log` are periodic PERFORMANCE and INPUT/FRAME/PKT summaries. | Every browser receives a constant log flood. The useful health data inside it is never parsed. |
| The browser polls `query_active_sessions` every 10 s. | 4,436 polls in the current log | The workload is waste that push would remove. |
| Delayed commands sleep inside the message loop. | `await asyncio.sleep(delay)` at `:103`, reached from `:412` inside the `async for` at `:452` | One delayed command stalls every other message for the whole delay. That includes other users' commands and session queries. |
| No websocket requires authentication. | `websocket-interfaces.md` lists none for the controller or either proxy. | Anyone who can reach the relay can command. |
| The browser uplink and downlink proxy services exist only for the status bar. | Nothing calls `sendBinaryCommand`, `configurePort`, or `disconnectPort` | Removing them is pure deletion (section 8). |
| The deployed setup already bypasses both proxies. | Uplink port is 12345, which is `simple_server.py`, which forwards to the hardware target's host and port. Downlink is a CLIENT_SOCKET to a NetAcquire host on port 10412. Both hosts are specific to that environment. | The proxies carry no live traffic today. |

## 3. Websocket or HTTP for control

| Concern | Commands over the controller websocket | Commands as HTTP POST (spec) |
| --- | --- | --- |
| Result correlation | Needs a client request id plus typed ack and error frames. None exist today. | Built in. The response carries `commandId` or an error status. |
| Authorization | Checked once at upgrade. Per-message scope checks and token expiry need custom code. | mod_auth_openidc enforces a scope per endpoint, `commands:send` or `sessions:manage`, on every call. |
| Audit | The proxy must log each frame with the identity captured at upgrade. | Every command is an access-log line with `REMOTE_USER`. |
| Retry safety | A drop right after `send()` leaves the client unsure whether the command went out. Dedupe ids are needed anyway. | An `Idempotency-Key` header makes retries safe. |
| User isolation | Shared socket state invites shared mutable config, as with today's `config` message. | Requests are stateless and every body names its session. |
| Tooling | Needs AsyncAPI and cannot be driven with curl. | OpenAPI, curl, scripts, and generated clients all work. |
| Latency | Saves one request per command. | One request on a kept-alive connection. That is negligible next to a tool run of more than a second. |
| Server push | Natural fit. | Not possible without a separate channel. |

**Verdict:** use HTTP for actions and a websocket for events.

If the team still wants control frames on the websocket, the spec would need all of these:

1. A message envelope with a client `requestId`, typed `ack`, `result`, and `error` replies,
   and a timeout rule.
2. Per-message scope enforcement and a close code for expired authentication.
3. Deduplication of command requests across reconnects.
4. A defined outcome for in-flight requests when the socket drops.
5. Non-blocking dispatch, so a slow or delayed command cannot stall the socket.
6. Per-connection state scoping, so no message can change another user's configuration.
7. An AsyncAPI document, since OpenAPI cannot describe client-to-server frames. The spec
   already says this.

Together these rebuild HTTP request and response semantics on a socket. Human-paced immediate
commands gain nothing from that.

## 4. Spec gaps for AMPCS

### 4.1 Controller messages against the spec

| Controller message | Closest spec operation | Gap |
| --- | --- | --- |
| `config`: uplinkHost, uplinkPort, scid, venue | `POST /command-sessions` takes sessionIds, defaultTarget, timeout | There is no way to pass venue, spacecraft id, uplink host and port, SSE host and port, or testbed. The spec assumes an existing tracking session carries them. `chill_send_cmd --sessionKey` can attach when such a session exists. Creating one needs explicit config. |
| `command`: stem, arguments, control_type, delay | `POST /commands/flight-software` and `/commands/hardware` | Immediate commands are covered. `delayed` has no immediate equivalent, but a one-entry CMF queue with relative timing covers it. The response lacks status, request id, and SCMF path. No 409 or 422 errors are defined. |
| `downlink_config`: host, venue, connectionType, port, inputFormat | `POST /downlink-sessions` takes sessionIds | **Incompatible.** chill_down has no session-key option. It always creates a new session, whose number appears in stdout only after startup. A create form with connection parameters and an async result is needed. |
| `query_active_sessions` | `GET /command-sessions`, `GET /downlink-sessions` | Downlink rows lack host, port, connection type, input format, venue, process state, and health. |
| `downlink_session_exit`: host, port | `DELETE /downlink-sessions` | This stops every downlink session. `DELETE /command-sessions` has the same problem. Per-session stop is needed. |
| `output` | none | No result or log channel exists. |
| `session_status`: created, terminated | none | No push channel exists. |
| Browser config `downlinkHosts` and `requirePort`, plus hardcoded SCIDs, venues, formats, and the 9828–9924 port range | none | Option lists and port allocation belong on the server. |

### 4.2 Other spec issues

1. **Slow, invisible session start.** Session start is synchronous and can take tens of
   seconds. Other clients never hear about it.
2. **Shared attach set.** The attach set is global proxy state shared by all operators.
   `DELETE /command-sessions` stops it for everyone, and nothing records who started a session.
3. **No outcome in `CommandDispatch`.** AMPCS reports `Status=Radiated` and the SCMF path
   for every command. The response should carry both.
4. **Uncorrelated command events.** The spec says command events carry the proxy
   `commandId`. AMPCS command events come from the AMPCS database and message bus and know
   nothing of that id. The spec must say how the proxy correlates them, or rely on the
   `command.*` events on the control stream.
5. **No idempotency.** Commanding is not idempotent, so retries need dedupe.
6. **Thin error set.** Commands define only 400, 401, and 403. Add 409 for a session that is
   not attached, and 422 for validation failures with per-argument detail.
7. **Dictionary version drift.** The dataset dictionary follows the telemetry session's
   `fsw_version` (`Dataset.js:238`). Commands go to the uplink session picked in Session
   Control, and the two can differ. The command session should report the flight dictionary
   version it translates with.
8. **Stream frame shape.** Every `/streams/*` description says a frame is one row. The
   realtime worker iterates each frame as an array (`MCWSStreamWorkerScript.js:214`). A proxy
   built from the spec text would break every realtime view.

## 5. Proposed spec changes

[`openapi-control-additions.yaml`](openapi-control-additions.yaml) is written to merge into
v0.11.0 at the operation level. Every item is tagged `x-proposal: new` or
`x-proposal: replaces`.

| Kind | Items |
| --- | --- |
| New operations | `GET /streams/control`, `GET /control/options`, `GET` and `DELETE /command-sessions/{sessionId}`, `GET` and `DELETE /downlink-sessions/{downlinkId}` |
| Replaced operations | `POST /command-sessions`, `POST /downlink-sessions`, `POST /commands/flight-software`, `/hardware`, `/simulator` |
| New components | `Idempotency-Key` header, `Conflict` and `UnprocessableCommand` responses, `ControlEvent`, `ControlSnapshot`, `ControlClientMessage`, `LogLine`, `DownlinkStatus`, `ControlOptions`, `HostOption`, `UplinkSessionConfig`, `DownlinkSessionConfig`, `ValidationError` |
| Replaced components | `CommandSessionStart`, `DownlinkSessionStart`, `ActiveCommandSession`, `ActiveDownlinkSession`, `CommandDispatch` |

Two edits must be applied by hand, as the file header says. Every `/streams/*` description
must say that each frame is a JSON array of rows, and `info` needs a version bump.

Key semantics of the proposal:

- **Snapshot and replay.** `/streams/control` sends a `snapshot` on connect, then events with
  a monotonic `seq`. A reconnecting client passes `since=<seq>` to replay missed events, or
  gets a fresh snapshot with `resync: true`. Clients send only `subscribe` frames.
- **Async downlink create.** `POST /downlink-sessions` with `create` returns 202 with
  `state: starting` and a proxy-issued `downlinkId`. The AMPCS session number arrives later
  in `downlink-session.started`.
- **Two-stage command results.** A 200 from a command endpoint means the outcome is known,
  either `radiated` or `failed`. A 202 means the command was dispatched and the outcome will
  arrive as a `command.completed` or `command.failed` event.

Breaking changes:

- `ActiveDownlinkSession` is keyed by a new `downlinkId`, and `sessionId` becomes nullable.
  `SessionControl.vue` keys its rows on `sessionId` today.
- `CommandSessionStart` and `DownlinkSessionStart` require either `sessionIds` or `create`.
- `CommandDispatch.status` becomes required.

Validation results:

- I merged the fragment into a copy of v0.11.0. All 91 `$ref`s resolve, every path template
  parameter is declared, and every tag exists.
- Redocly CLI 1.x reports both the original and the merged spec as valid.
- The merge adds 8 warnings, all matching existing patterns. The spec has no operationIds
  anywhere, websocket operations only answer 101, and `ControlClientMessage` is referenced only
  in prose because OpenAPI cannot model client frames.

## 6. feat-484 plugins against AMPCSController

### 6.1 Feature parity

| Capability | AMPCSController | feat-484 | Proposed action |
| --- | --- | --- | --- |
| Status-bar indicator | Shows Not Configured, Connecting, or Configured, with Configure, Settings, and Disconnect | None | Add a mission-control indicator |
| Endpoint config | `ampcsController.controlUrl` and related keys | `./api/v1` is hardcoded (`missionControlService.js:3`), and view providers pass no base | Add `missionControl.apiBase` in the four config places AGENTS.md lists |
| Uplink config: host, port, SCID, venue | Yes | No, because of a spec gap | `create` form driven by `/control/options` |
| Downlink create with host, venue, connection type, port, and format | Yes, with a host list and fixed ports | Only "start for session ids" | `create` form, with ports allocated by the proxy |
| Port conflict check and next free port | Client-side | None | Server-side allocation |
| Active session list | Yes, with per-session Disconnect and Resume | Yes, but only Stop-all (`SessionControl.vue:263`, `:280`) | Per-session stop |
| Live session state | 10 s polling plus `session_status` push | Manual Refresh only | Control stream |
| Selected session survives reload | Config persisted in localStorage | Held in memory only | Persist per user and re-check against `GET /command-sessions` |
| Command result feedback | None shown, since `output` is never displayed | Only "Sent <id> at <time>" | Status from the 200 or 202 response plus `command.*` events |
| Command history | Last 20 sends, echoed locally | None | History panel fed by results |
| Delayed command | `control_type: delayed` | None | One-entry CMF queue, or leave it to a queue UI |
| Module filter | Dictionary `categories.module` | Stem text before the first `_` (`ImmediateCommand.vue:195`) | Carry the AMPCS module category into the dataset JSON |
| Target side A, B, or AB per command | No | In the spec, but the UI sets it only at session start | Optional per-command selector |
| Server-side validation | On by default in AMPCS | The client always sends `validate: false` (`missionControlService.js:120`) | Default to true |
| Authentication | None | OIDC cookie via `credentials: 'include'` | Keep it, and gate the UI with `/auth/whoami` |

### 6.2 Defects found in feat-484

I ran `commandArguments.js` in Node with argument shapes taken from the upstream
`@nasa-jpl/aerie-ampcs` type definitions, which define the plandev-ampcs format.

```
arguments:      fill, var_string "hello, world", enum given as numeric "1",
                numeric/integer "2.5", repeat
validation:     {"pad":"Value required","mode":"Must be one of: SAFE, NOMINAL"}
command string: TEST_CMD,,hello, world,1,2.5,9
```

Encoding rules below come from `chill_send_cmd --help` on the local AMPCS install.

1. **Fill arguments are treated as required inputs.** They block sending and add an empty
   slot to the command string. AMPCS says fill arguments are never input.
2. **String arguments are not quoted.** AMPCS expects `"value"`. A comma inside a string
   splits it into two arguments.
3. **Enum numeric values are rejected.** The check compares `entry.value`
   (`commandArguments.js:84`), but plandev-ampcs enum values are `{symbol, numeric}`.
4. **Integer `numeric` arguments accept fractions.** The integer check looks only at
   `arg_type` (`commandArguments.js:32`) and ignores the nested `type: integer`.
5. **Repeat groups get a free-text box and pass through raw.** The AMPCS help gives the
   form `#_repeats,arg1_value,...,argN_value`, a repeat count followed by values built
   from the nested arguments.
6. **The dictionary test fixture is missing.** The dictionary spec imports
   `test_data/CommandDictionary.json`, which `.gitignore:39` excludes. The fixture is not in
   the branch, so the spec cannot run on a clean clone.
7. **Stem lists go stale.** The dictionary reloads when the telemetry session changes
   (`CommandDictionary.js:53`), but the view keeps the stem lists it read at mount
   (`ImmediateCommand.vue:262`).

### 6.3 What feat-484 already does better

- The dataset serves the dictionary, and it is loaded once.
- Commands get correlated ids, OIDC scopes, and separate FSW, HW, and simulator endpoints.
  Target side, queues, transfers, and a catalog are in the contract.
- The shared service uses provide and inject instead of `window.*` globals.
- The service and argument helpers have unit tests.

## 7. Proposed changes to the feat-484 plugins

### missionControlService

- Accept `{ apiBase, controlStreamUrl }` from config.
- Add a control-stream client. It connects on first use and applies the snapshot and then
  each event to the reactive state. It reconnects with backoff and `since=<seq>`, and replaces
  state on `resync`.
  - The backoff and event emitter in `AMPCSWebSocketManager` are reusable once its debug
    logging is removed.
  - Do not reuse `src/realtime` for this. It is built for telemetry: it needs an active
    telemetry topic, routes by a row property, and does not reconnect after an unexpected close.
- Send an `Idempotency-Key` from `crypto.randomUUID()` with every command and session start.
- Default `validate` to true.
- Keep a bounded command log keyed by `commandId`, updated from responses and `command.*` events.
- Persist the selected uplink session in localStorage.
- Expose a dictionary-mismatch check that compares the dataset dictionary header with the
  session's `fswVersion`.

### SessionControl.vue

- Add uplink and downlink create forms driven by `/control/options`. Fixed-port hosts come
  from the server, and the client does no port bookkeeping.
- Add a Stop button per uplink and downlink row. Keep stop-all behind a confirmation.
- Show state, who started each session, venue, SCID, and downlink health: in sync, data
  flowing, bitrate, and last input time.
- Make the control stream the update path. Keep Refresh as a manual resync.
- Optionally add a log pane subscribed to the `log` family.

### ImmediateCommand.vue and commandArguments.js

- Fix the seven defects in section 6.2.
- Add a result panel showing each send's status moving from `accepted` to `radiated` or
  `failed`, with its message and SCMF path. Keep a history list.
- Warn or block when the dataset dictionary does not match the attached session's version.
- Optionally add a per-command target side.
- Show range hints and validate as values are typed.

### Mission control indicator

- Add a status-bar indicator. It shows whether the proxy is reachable via `/health`, whether
  the control stream is connected, how many sessions are attached, and which one is selected.
  Clicking it opens Session Control.

### Dictionary

- Commit the fixture with `git add -f`, or narrow the `.gitignore` rule.
- Carry the AMPCS `<categories><category name="module">` value through the converter into
  the dataset JSON. `CommandDefinition` allows extra properties. Then use it in the module
  filter.

## 8. Removing the browser proxies from AMPCSController

If AMPCSController stays in use until feat-484 reaches parity, make these changes:

- Delete `services/UplinkProxyService.js` and `services/DownlinkProxyService.js`.
- In `plugin.js`, drop `downlinkProxyUrl`, `uplinkProxyUrl`, both services, their `window.*`
  globals, their cleanup code, and their provide entries.
- In `AMPCSConfigIndicator.vue`, `ConnectionStatusBar.vue`, and `SessionConfigDialog.vue`,
  drop the injected proxy services and the downlink and uplink status rows. "Connecting" and
  "configured" should depend on the control socket alone.
- In `AMPCSSessionStore.js`, drop `connectionStates.downlink` and `connectionStates.uplink`.
- In `config.js`, drop `downlinkProxyUrl` and `uplinkProxyUrl`.
- In the docs, drop sections 2 through 4 of `websocket-interfaces.md`.

On the server side, `uplinkproxyserver.py`, `downlinkproxyclient.py`, their config files, and
their `nohup_runner` entries become unused. The standalone app in `~/webdev/test-js-uplink`
keeps its own copies, so check it before retiring the `/uplinkProxy` and
`/downlinkProxy` endpoints.

**Recommended path:** stop investing in AMPCSController. Port its missing capabilities into
feat-484 as described in section 7, then retire it.

## 9. Assumptions and open questions

- **Proxy location.** On the AMPCS host, the proxy can run the chill tools directly.
  Anywhere else it needs the outbound agent link. `ampcs_controller_client.py` is a starting
  point, but it needs request ids, structured results, non-blocking delays, per-process
  supervision, and output parsing.
- **Session reuse.** Confirm on the AMPCS host that `chill_send_cmd --sessionKey` reuses an
  existing session rather than creating one. The help text suggests it does.
- **Shared or per-user attach.** Decide whether operators share one command-service attach
  set or attach per user.
- **Delayed immediate commands.** Decide whether these are needed, or whether the queue UI
  is enough.
- **chill_down M&C service.** chill_down offers a RESTful M&C service via `--restPort`. It
  may provide health and clean shutdown without parsing stdout. Its endpoints are worth
  checking.

## 10. Not done

- I did not build an instance with `mct build`, run Karma tests, or exercise a live proxy.
  No proxy implementation exists yet.
- No code changed in either repository. The feat-484 worktree can be removed from the main
  clone with `git worktree remove ../openmct-mcws-feat-484`.
