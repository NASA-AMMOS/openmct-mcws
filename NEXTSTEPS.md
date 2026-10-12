<!-- cspell:words telem ingester worktree fswsse uplinkproxyserver downlinkproxyclient webdev openidc nohup asyncio Redocly mudinthewater MOCRT libwayland libgbm libdrm fastmio dockerized aiohttp -->

# Next steps: AMPCS commanding through mcws-proxy-api

Handoff notes for continuing the AMPCS session control and immediate command
work on another machine, such as the dockerized AMPCS host. Read this first.
It records what was done on 2026-10-12, what was verified and how, and what is
left. The audience is a developer or coding assistant who did not see the
original session.

## 1. Where things stand

- **Plugin side: done and tested.** Session Control builds its uplink and downlink
  session forms from build-time YAML config, opens long-lived sessions, and
  stops one session at a time. Immediate Command sends FSW, HW, and simulator
  commands with corrected AMPCS argument encoding, and shows radiation status
  from command events.
- **Contract: updated.** `mcws-proxy-api/openapi.yaml` is at v0.12.0 and
  describes exactly what the plugin calls, including the AMPCS mapping.
- **Backend: not started.** No proxy implementing the spec exists yet. The
  plugin has only been exercised against the fake proxy in
  `mcws-proxy-api/dev/`. The old AMPCS controller scripts were not changed.
  Building the proxy on the AMPCS host is the next job (section 6).

## 2. Branches

Two local branches were committed on the original VM. Neither has been pushed.

| Branch | Base | Contents |
| --- | --- | --- |
| `feat-484-ampcs-session-control` | `feat-484-command-dictionary` (`c318b60`) | One commit, `a7d805c`: the feature work only. Use this for an upstream pull request. |
| `build/ampcs-6.1.0-next` (this branch) | same | The feature commit plus the merges below, plus this file and `mcws-proxy-api/dev/`. Use this for builds and testing. |

Merges on `build/ampcs-6.1.0-next`, in order:

| Merge | What it brings |
| --- | --- |
| PR #478 | Alarm dictionary and EVR view "view historical data" actions. It is based on `main`, so it also brings `main`: version 6.1.0-next, the ES-module ESLint config, and Prettier reformatting. |
| PR #474 | Relative import casing fixes; Linux builds fail without it. |
| PR #473 (`fix-472-vista-style-import`) | Side-effect-only `vista.scss` import; the production build fails without it. |
| PR #475 | Persistence provider fixes for new user logins. |
| PR #482 | EVR level styling lookup fix (#481). |
| PR #483 | Realtime staleness indicator update. |
| `feat-dynamic-time-presets` | `src/time/dynamicPresets.js`: revives `${dynamic:...}` markers in runtime `mcws-config.json`, including the UTC calendar anchors `dayStart:n`, `monthStart:n`, `yearStart:n`. |

Only PR #478 conflicted. Versions took 6.1.0-next, pure formatting took
`main`, and this branch's command types and `missionControl` config were kept.

## 3. Decisions made

- The proxy runs on the AMPCS host. No relay or agent link is needed.
- Commands go over plain HTTP POST, not over a websocket. The spec uses POST
  for commands; PUT appears only in persistence. HTTP gives per-request
  authorization, correlation, audit, and safe retries.
- One long-lived uplink session is opened and reused, like downlink.
- Downlink sessions use the AMPCS TM ingester REST control, which returns the
  session ID immediately.
- Session form fields, option lists, port ranges, and fixed-port hosts come from
  plugin config in the instance YAML at build time. There is no options endpoint.
- Stop applies to one session. The stop-all endpoints were removed from the spec.
- Radiation status comes from the existing command event endpoints.
- Delayed immediate commands are out of scope. feat-484 never had them.
- The browser-side uplink and downlink proxy websockets from the old
  AMPCSController plugin are retired. Nothing in the new plugins uses them.
- Still only proposed, not implemented: a push-only `/streams/control`
  websocket for session and command lifecycle events, `Idempotency-Key`, and
  status fields on `CommandDispatch`. See `docs/ampcs-control/`.

## 4. Plugin side

### Code map

| Path | Role |
| --- | --- |
| `src/missionControl/missionControlService.js` | Shared service. Proxy calls, session state, selected uplink session, command tracking. |
| `src/missionControl/sessionFields.js` | Config-driven form logic: normalization, defaults, auto-assigned ports, option locks, uniqueness, typed parameters. |
| `src/missionControl/commandStatusTracker.js` | Matches command events to sent commands. |
| `src/missionControl/commandEventStream.js` | Websocket client for the command event stream, with reconnect. |
| `src/sessionControl/components/SessionControl.vue`, `SessionFieldsForm.vue` | Session Control view. |
| `src/immediateCommand/commandArguments.js` | plandev-ampcs argument validation and AMPCS command-string encoding. |
| `src/immediateCommand/components/ImmediateCommand.vue` | Immediate Command view, with the sent-commands and radiation status table. |
| `CONFIGURATION.md`, section "Mission Control Configuration" | `missionControl` option reference and a complete AMPCS YAML example. |

### What the plugin calls

The proxy must implement these. `apiBase` defaults to `./api/v1`, relative to
the Open MCT page URL, so the web front end must route that path to the proxy
on the same origin. All calls send `credentials: 'include'`.

| Call | Body | Expected response |
| --- | --- | --- |
| `GET /sessions/active` | none | `[{number, topic, host}]`; return `[]` when there is no MCWS |
| `GET /command-sessions` | none | `[{sessionId, startTime, parameters, topic, host}]` |
| `POST /command-sessions` | `{parameters, defaultTarget, timeout}` opens; `{sessionIds, defaultTarget, timeout}` attaches | `{sessionIds: [id], startTime}` |
| `DELETE /command-sessions/{sessionId}` | none | 204 |
| `GET /downlink-sessions` | none | `[{sessionId, startTime, parameters, state}]` |
| `POST /downlink-sessions` | `{parameters}` opens; `{sessionIds}` attaches | `[{sessionId, startTime, parameters, state}]`, or 409 when a unique value such as host plus port is taken |
| `DELETE /downlink-sessions/{sessionId}` | none | 204 |
| `POST /commands/flight-software` | `{sessionId, commandString, validate: false, target?, timeout?}` | `{commandId, requested, dispatchTime}` |
| `POST /commands/hardware` | `{sessionId, commandStem, target?, timeout?}` | same |
| `POST /commands/simulator` | `{sessionId, commandString, timeout?}` | same |

Any non-2xx response is shown to the operator with its body text.

Radiation status is not read from these responses. The Immediate Command view
opens the selected dataset's `commandEventStreamUrl` as a websocket with
`?filter=(session_id=<id>,topic=<topic>)` and matches rows to sent commands.
It matches by `commandId` when a row carries one. Otherwise it uses session,
command stem, and time, then sticks to that row's `request_id`. Rows are MCWS
command events: `session_id`, `command_string`, `status` (for example
`Radiated`), `fail_reason`, `scmf_file`, `request_id`, `final`, `event_time`.
Frames may be a JSON array of rows or a single row. The "Check status" button
reads the dataset's `commandEventUrl` with
`filter=(session_id=<id>,event_time>=<DOY time>)`.

### Session parameters

Each configured field's `key` becomes a key in `parameters`. In the YAML
example the keys are AMPCS long option names, so the proxy can map
`{fswDownlinkPort: 9828}` to `--fswDownlinkPort 9828` against an allowlist.
`mcws-proxy-api/dev/instance/instance.yaml` has the working AMPCS field set:

- **Uplink:** `venueType`, `spacecraftID`, `fswUplinkHost`, `fswUplinkPort`.
- **Downlink:** `venueType`, `downlinkConnectionType`, `fswDownlinkHost`,
  `fswDownlinkPort` (auto-assigned in 9828 to 9924, unique per host),
  `inputFormat`. The NetAcquire host option locks the port to 10412. Its host
  name is the placeholder `netacq.example.com`.

The uplink port default there is 9825, carried over from the old plugin. In
the original realtime setup chill_send_cmd actually targeted port 12345, where
`simple_server.py` forwards to the hardware. Set the default to match the
docker environment.

### Command string encoding (verified against AMPCS)

The plugin builds `STEM,arg1,...,argN` for chill_send_cmd:

- **Fill arguments** are never input, at any nesting level.
- **String arguments** (`var_string`, `fixed_string`) are wrapped in double
  quotes, so commas stay inside one argument. Values containing `"` are rejected.
- **Enum values** are sent as the dictionary symbol, even when typed as the
  numeric value.
- **Repeat arguments** are the repeat count followed by each set's values. This
  follows `UplinkInputParser.parseAndSetRepeatArgument` in the AMPCS source.
- **Hardware commands** send only the stem. The proxy should send simulator
  strings with AMPCS's `sse:` prefix.

The plugin sends `validate: false` because it validates on the client. AMPCS
validates by default. To keep server-side validation, map
`validate: false` to nothing, rather than to `-x`. This choice is still open.

## 5. AMPCS facts verified on the original VM

These were tested against AMPCS 9.0.0B2 with its MySQL database and, for the
send test, ActiveMQ on `tcp://localhost:61614`. Recheck them in the docker image.

### Uplink: one reusable session

1. Open a session without sending anything:

   ```bash
   printf '// open command session only\n' > open_session.cmd
   chill_send_cmd -f open_session.cmd -V TESTSET -S 252 \
     --fswUplinkHost 127.0.0.1 -B 12345 -M <unique-session-name> -L "<description>"
   ```

   This created session 22 and transmitted nothing. Find the key from the
   `{N}` context in the log output, or with
   `chill_get_sessions -M <unique-session-name> -o csv`. The second column is
   the session ID.
2. Send each command into that session:

   ```bash
   chill_send_cmd 'STEM,arg1,...' -K <key>
   ```

   AMPCS loads the session's stored configuration: dictionary, spacecraft IDs,
   and output directory. It creates no new session and files the command under
   that key. Output to parse: `uplink request submitted: Status=Radiated (Request ID=)`,
   `Wrote SCMF to <path>`, and the exit code. Add `-s A|B|AB` for the target
   side and `-x` to skip validation.
3. Confirm the record:

   ```bash
   chill_get_commands -K <key> -o csv
   ```

   This returned a FlightSoftwareCommand row with a database request ID
   (`FSW-...`), status `Radiated`, and `final=true`. The ActiveMQ command
   message for the same send had an empty request ID, so the proxy must
   correlate its own `commandId`. Use the session, command string, and time,
   or this database request ID.
4. **Limits:**
   - AMPCS refuses uplink on a downlink-only session: "Supplied session
     configuration key is for a downlink-only configuration and cannot be used
     by this uplink application."
   - Without `-K`, chill_send_cmd creates a new session for every command. The
     old controller did this, and each run took over a second.
   - `-b` (binary file) and `-k` (SCMF only) disable the database, so tests
     using them do not prove database behavior.

### Downlink: TM ingester with REST control

`ampcs-host` below stands for the session host name that AMPCS reports. See
"Environment-specific values" in section 7.

```bash
chill_telem_ingest --restPort 18511 --restInsecure &        # persistent server
MC="chill_telem_ingest_mc --restPort 18511 --restInsecure"
$MC status                      # {"value": "OK"}
$MC createSession               # {"message": "SESSION CREATED", "key": 23, "host": "ampcs-host"}
$MC attach --sessionKey 23 --sessionHost ampcs-host --venueType TESTSET \
   --downlinkConnectionType CLIENT_SOCKET --fswDownlinkHost 127.0.0.1 \
   --fswDownlinkPort 19999 --inputFormat RAW_TF --spacecraftID 252 \
   --sessionName omm_downlink_probe
                                # INGESTION WORKER ATTACHED, worker 23/ampcs-host/2, READY
K="--sessionKey 23 --sessionHost ampcs-host --sessionFragment 2"
$MC start $K                    # ACTIVE
$MC state $K                    # {"value": "ACTIVE"}
$MC telem $K                    # JSON: status.connected/inSync/flowing, bitrate, frames, packets...
$MC perf $K                     # JSON heap health
$MC stop $K; $MC release $K     # WORKER STOPPED, WORKER RELEASED
$MC shutdown                    # the process still needed a SIGTERM afterwards
```

- **No arbitrary keys.** A caller cannot choose the session number. `attach`
  with an unknown key fails with "No sessions found in the database. Provide a
  valid session configuration file to create a new session." Use
  `createSession` and return its key.
- **Required arguments.** `attach` requires `--sessionHost`. Every attach makes
  a new fragment, so the proxy must store key, host, and fragment.
- **Session types.** `attach` also refuses an uplink-only session.
- **Shared sessions are possible but untested.** A `createSession` session is
  flagged for both downlink and uplink, but it uses the default mission
  configuration, which was the Generic dictionary with SCID 0 here.
  chill_send_cmd accepted it, but a shared session needs a correct mission
  configuration first.
- **Processor untested.** The telemetry processor was not tested.
  `chill_telem_process` with `chill_telem_process_mc` has the same `attach`,
  `start`, `stop`, and `release` by key, and produces channel values and EVRs.
  Verify the full ingest-plus-process pipeline in docker.
- **Alternative.** `chill_down` with `--restPort` and `chill_down_mc` also
  works, but chill_down always creates its own session. Its key appears in
  stdout as `(key N)` only after startup.

### chill_send_cmd command syntax

From `chill_send_cmd --help`: fill arguments are skipped, string values are
`"value"`, a repeat argument is `#_repeats,arg1_value,...`, and `[default]`
selects an argument's default value. A quoted string containing a comma was
accepted. The same string unquoted failed with "Parser was finished, but there
are still extra command argument values."

## 6. Backend: what to build next

The service is a proxy on the AMPCS host, inside the docker container, that
implements section 4's calls. Python with aiohttp or FastAPI matches the
existing tooling. The language is open.

### Endpoint to AMPCS mapping

| Endpoint | AMPCS action |
| --- | --- |
| `POST /command-sessions` with `parameters` | Write a comment-only command file. Run chill_send_cmd with the allowlisted parameters as `--key value` arguments. Look up the new key. Store `{sessionId, host, topic, parameters, startTime}`. |
| `POST /command-sessions` with `sessionIds` | Check each session is uplink-capable with `chill_get_sessions -K`, then store it. |
| `DELETE /command-sessions/{id}` | Forget the session. There is no process to stop. |
| `POST /commands/flight-software` | Generate a `commandId`. Run `chill_send_cmd '<commandString>' -K <id>` with `-s` from `target` and the `timeout`. Record `{commandId, sessionId, commandString, dispatchTime}`. Reply with `{commandId, requested, dispatchTime}`. |
| `POST /commands/hardware` | Same, with the stem as the command string. |
| `POST /commands/simulator` | Same, with an `sse:` prefix. |
| `POST /downlink-sessions` with `parameters` | Reject a used host plus port with 409. Call ingester `createSession`, then `attach` with the parameters, then `start`. Do the same on the telemetry processor. Store `{sessionId, host, fragment, parameters, startTime}`. Reply with the session and its `state`. |
| `DELETE /downlink-sessions/{id}` | `stop` then `release` on the ingester and processor workers. |
| `GET /downlink-sessions` | Stored sessions, with `state` from ingester `state`. |
| `GET /sessions/active` | Pass through MCWS session LAD if present, else `[]`. |
| Command event stream and history | Pass through MCWS `commandEventStreamUrl` and `commandEventUrl` if MCWS runs in docker, adding `commandId` to rows the proxy can correlate. Without MCWS, build them from `chill_get_commands -K <id>` or the ActiveMQ command topic. |

### Rules

- **Allowlist.** Accept only the parameter keys configured in the YAML, and
  respond 400 to anything else. Build tool arguments as an argv list, never as
  a shell string.
- **Persistence.** Persist the session table, for example to a JSON file, so a
  restart does not orphan open sessions.
- **Serialization.** Send commands for one session one at a time. Never block
  the server loop. The old controller ran `asyncio.sleep(delay)` inside its
  message loop, which stalled everything.
- **Authentication.** It is out of scope for development. The spec's model is
  OIDC through mod_auth_openidc, with `REMOTE_USER` and groups mapped to scopes.

### Starting points

- `mcws-proxy-api/dev/fake-proxy-server.mjs`: an executable mock of the
  contract with in-memory state. Use it as the shape of the responses.
- `mcws-proxy-api/dev/reference/ampcs_controller_client.py`: the old
  controller. It already wraps chill_send_cmd and chill_down and parses their
  output, but it speaks the old relay websocket protocol. Its relay URL was
  reduced to the path `/controller`.
- `mcws-proxy-api/openapi.yaml`: the contract, including AMPCS mapping notes.

### Old realtime scripts

These are on the original VM in `fake_mcws/realtime`:

| Script | Fate |
| --- | --- |
| `ampcs_controller_client.py` | Replace with the proxy. |
| `uplinkproxyserver.py`, `downlinkproxyclient.py`, their configs, and their `nohup_runner` entries | Retire. Check the standalone `~/webdev/test-js-uplink` app first, which has its own copies. |
| `simple_server.py`, `america1_demo.py` | Keep. This is the hardware uplink bridge that chill_send_cmd targets: port 12345 forwards to the target system. |
| `MOCRTClient.py` and the watchers | Unrelated telemetry push. Keep. |

### Suggested order on the docker host

1. Build and deploy this branch's instance (section 7), pointed at the proxy.
2. Implement command sessions and FSW commands. Send a NOOP into a local
   listener and confirm a `Radiated` row from `chill_get_commands -K`.
3. Add command event pass-through or synthesis, and check the Immediate Command
   radiation status column end to end.
4. Implement downlink sessions with ingester and processor `attach`, `start`,
   `stop`, and `release`.
5. Retire the old scripts and the `/controller`, `/uplinkProxy`, and `/downlinkProxy`
   relay endpoints.

## 7. Building and testing

### Plugin

```bash
git checkout build/ampcs-6.1.0-next
npm install
npm test                 # Karma + Jasmine, ChromeHeadless; set CHROME_BIN
npm run lint             # main's ES-module ESLint config works directly
npm run build:prod
npm pack --pack-destination /tmp     # /tmp/openmct-mcws-plugin-6.1.0-next.tgz
```

Expected results on the original VM:

| Check | Result |
| --- | --- |
| Tests, three runs in random order | 321 passed |
| Production build | Passes, with only bundle-size warnings |
| ESLint | 7 errors, all in PR #478's EVR view files, left as upstream wrote them |

- **Node version.** `package.json` wants Node 24.14.1 or newer. Node 24.13.0 also worked.
- **Headless Chrome on minimal Linux.** chrome-headless-shell may need
  at-spi2-atk, at-spi2-core, mesa-libgbm, libdrm, and libwayland-server. The
  original VM used user-space copies through `LD_LIBRARY_PATH`.
- **Random test order.** Jasmine randomizes order, and `SessionService`'s
  default export is a singleton. Any spec that constructs it must use the same
  session config as the other specs, or results depend on order.
  `CommandDictionarySpec` was fixed for this.

### Instance

The build tool is the user's fork, `mudinthewater/openmct-build`, branch
`feat-dynamic-substitutions`. On Linux, change the `mct` shebang to
`#!/usr/bin/env -S npx tsx` if it fails with "env: npx tsx".

```bash
mkdir -p <openmct-build>/instances/ammos-ampcs-control
cp mcws-proxy-api/dev/instance/instance.yaml <openmct-build>/instances/ammos-ampcs-control/
cd <openmct-build> && mct build --instance ammos-ampcs-control
cp <repo>/mcws-proxy-api/dev/instance/mcws-config.json <openmct-build>/instances/ammos-ampcs-control/
cd instances/ammos-ampcs-control && jar -cf ../ammos-ampcs-control-openmct_client.war .
```

- **Base config.** `instance.yaml` is the user's base instance plus the `missionControl` block.
- **Bootstrap plugin.** It points at `file:./assets/mct-bootstrap-plugin`, which mct copies into every instance.
- **Runtime config.** `mcws-config.json` is the user's, with dynamic fixed presets. It needs `feat-dynamic-time-presets`.
  Host names were removed from its URLs, leaving paths such as `/mcws` and
  `/mcws/fastmio/users`, and `camUrl` is blank. Paths resolve against the server
  hosting the instance. Set full URLs and `camUrl` for the target environment.
- **Conductor warning.** The bare `openmct.plugins.Conductor` line throws "Invalid Time Conductor Configuration" at startup. It is harmless, because the MCWS time plugin installs its own conductor. Remove the line to silence it.

### Environment-specific values

These values were removed or replaced with placeholders. Set them for each
deployment before testing against real systems.

| Value | Where it appears | What to set |
| --- | --- | --- |
| NetAcquire host | `netacq.example.com` in `mcws-proxy-api/dev/instance/instance.yaml` and the `CONFIGURATION.md` example | The NetAcquire host name. Its option also fixes the downlink port, which was 10412 in the original setup. |
| Hardware uplink target | The target that `simple_server.py` forwards to on the AMPCS host | The target system's host and port. The original environment used a private network address. Also set the `fswUplinkHost` and `fswUplinkPort` field defaults to wherever chill_send_cmd should deliver. |
| AMPCS session host | `ampcs-host` in the section 5 examples | The host name AMPCS records on sessions. `createSession` returns it, and `attach`, `start`, `stop`, and `release` take it as `--sessionHost`. It comes from the AMPCS configuration of the docker host. |
| MCWS and CAM | `mcwsUrl`, `camUrl`, and namespace URLs in `mcws-config.json`; `mcwsUrl` in `instance.yaml` | `mcws-config.json` holds paths only and a blank `camUrl`. The YAML `mcwsUrl` still points at the original environment, and the runtime file overrides it. |

### Checking without a real proxy

```bash
ROOT=<openmct-build>/instances/ammos-ampcs-control node mcws-proxy-api/dev/fake-proxy-server.mjs 18620 &
CHROME_BIN=<chrome> BASE_URL=http://127.0.0.1:18620 OVERRIDE_RUNTIME_CONFIG=1 \
  node mcws-proxy-api/dev/e2e-check.mjs
```

`e2e-check.mjs` exits 0 only when every check passes:
- the config arrives from the build layer;
- today's fixed bounds and the "Last week to end of today" preset are correct;
- the forms render;
- a downlink and an uplink session open;
- the fixed-port lock works;
- a stop deletes exactly one session.

`OVERRIDE_RUNTIME_CONFIG=1` blanks the CAM and MCWS URLs in flight only, so the
page loads without those servers. Point the instance at the real proxy for
real testing.

## 8. Open items

- **Backend:** build the proxy (section 6).
- **Immediate Command end to end:** not yet tested against a real dataset with
  a command dictionary and command event stream. Unit tests cover it.
- **Validation:** decide the `validate` default (section 4).
- **Proposals:** the `/streams/control` push stream, idempotency keys, and
  dispatch status fields are in `docs/ampcs-control/openapi-control-additions.yaml`.
  Its session start, stop, and options items are superseded by the spec on this branch.
- **UI follow-ups:**
  - Persist the selected uplink session across reloads.
  - Add a mission control status indicator.
  - Record who opened each shared session.
- **Small bugs noticed but not fixed:**
  - `commandEventStreamUrl` is missing from `WEBSOCKET_STREAM_URL_KEYS` in
    `src/constants.js`, so the dataset does not normalize it. The new stream
    client normalizes it itself.
  - `MCWSParameters` sort direction checks `sortTerm.length === 2` instead of
    the split parts, so `__desc` never applies.
- **Upstream:** open a pull request from `feat-484-ampcs-session-control` into
  `feat-484-command-dictionary`. The build branch is integration only.

## 9. Side effects left on the original VM

- **AMPCS database:** test sessions 22 (`omm_uplink_probe`) and 23 were created,
  plus SCMF files and one test command record under session 21.
- **Chrome:** chrome-headless-shell is in `~/.cache/puppeteer`, with extra
  libraries in `~/.cache/chrome-libs`.
- **Build sandbox:** `/home/pasquale/OMM_BUILD/openmct-mcws-build` holds this
  branch's merges, and `/tmp/mct-e2e` holds earlier test scaffolding.

## 10. Reference documents

- `docs/ampcs-control/analysis.md`: the original gap analysis. It compares the
  old controller and AMPCSController plugin with feat-484, explains the
  websocket versus HTTP decision, and records later decisions in section 0.
- `docs/ampcs-control/openapi-control-additions.yaml`: the original spec
  proposals, partly superseded.
- `CONFIGURATION.md`: `missionControl` options.
- `mcws-proxy-api/openapi.yaml`: the contract.
