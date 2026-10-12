# AGENTS.md

Guidance for AI coding assistants creating or modifying plugins in this
repository (`openmct-mcws-plugin`). Human contributors: start with
[README.md](README.md) and [CONFIGURATION.md](CONFIGURATION.md).

This file orients an agent and routes it to canonical docs. It follows the
conventions of [openmct's AGENTS.md](https://github.com/nasa/openmct/blob/master/AGENTS.md):
read the relevant canonical document before working in an area rather than
inferring conventions from surrounding code, and do not duplicate their
contents here.

## What this repo is

`openmct-mcws-plugin` lets Open MCT use MCWS (Mission Control Web Services,
AMMOS) as a telemetry and persistence backend. It is one large plugin
([plugin.js](plugin.js), `openmctMCWSPlugin(options)`) composed of ~35
sub-plugins under [src/](src/), each with its own `plugin.js` exporting a
factory that returns an `install(openmct)` function — the same pattern as
Open MCT core plugins. ESM throughout (`"type": "module"`), Vue 3 SFCs,
webpack build, peer dependency `openmct@4.3.1`.

Branch naming is `feat-*` / `fix-*`.

## Canonical docs

| Topic | Document |
| --- | --- |
| Install, build-tool recipes, runtime config, audit | [README.md](README.md) |
| Every plugin option with recipe/JSON examples | [CONFIGURATION.md](CONFIGURATION.md) |
| Runtime config template | [mcws-config.example.json](mcws-config.example.json) |
| Proxy/backend API contract (MCWS surface, commanding, sessions, queues, transfers, catalog, auth) | [mcws-proxy-api/openapi.yaml](mcws-proxy-api/openapi.yaml) |
| Public plugin-authoring API (types, telemetry, time, indicators, views) | [openmct API.md](https://github.com/nasa/openmct/blob/master/API.md) |
| Core plugin reference implementations (69 plugins) | [openmct src/plugins](https://github.com/nasa/openmct/tree/master/src/plugins) |
| Core agent conventions, test strategy, pitfalls | [openmct AGENTS.md](https://github.com/nasa/openmct/blob/master/AGENTS.md) |

Peer dependency is `openmct@4.3.1`: check API availability against that
version, not core `master`, before using a new core API.

## Architecture

### Root install flow ([plugin.js](plugin.js))

1. Fetch optional runtime `./mcws-config.json` (404 tolerated).
2. Merge config layers, lowest precedence first: `defaultConfig` (in
   `plugin.js`) < build-tool recipe options < runtime JSON, plus `derived`
   values (e.g. `useDeveloperStorage`). Every leaf is source-tagged.
3. Expose `window.openmctMCWSConfig` and
   `window.openmctMCWSConfigurationAudit` (`runtime`/`build`/`default`/
   `derived`/`sources`).
4. Initialize singleton services: `SessionService(openmct, config)`,
   `DatasetCache(openmct)`, `GlobalStaleness(...)`; `mcwsClient.configure(config)`.
5. `openmct.install(...)` each sub-plugin, passing only its config slice
   (e.g. `config.tablePerformanceOptions`, `config.taxonomy`).
6. Set user provider, persistence provider (unless `useDeveloperStorage`),
   branding, `openmct.telemetry.greedyLAD(false)`, plugin CSS.

### Sub-plugin map (src/)

Telemetry: `historical/` (one `HistoricalProvider` dispatching to
per-domain providers in `historical/providers/`) and `realtime/` (one
`MCWS*StreamProvider` per stream, all extending `MCWSStreamProvider`).

Taxonomy and types: `types/` (`vista.*` types via `VISTAType`, composition
policy, shared formats), `taxonomy/`, `venues/`, `containerView/`.

Views: `evrView/`, `alarmsView/`, `channelTable/`, `packetSummary/`,
`frameSummary/`, `frameAccountability/`, `messagesView/`,
`commandEventsView/`, `packetQuery/`, `dictionaryView/`,
`product-status/`, `frameEventFilterView/`. Table-style views take
`config.tablePerformanceOptions`.

Services: `services/mcws/` (MIO client), `services/session/`
(`SessionService`), `services/dataset/` (`DatasetCache`, channel/EVR/
command dictionaries), `services/identity/`, `services/filtering/`,
`services/time/`, `services/globalStaleness/`.

Persistence: `persistence/` (namespace/opaque-file providers, user
containers, migration interceptors).

Indicators: `mcwsIndicator/`, `realtimeIndicator/`,
`clearDataIndicator/`.

Actions and modifiers: `exportDataAction/`, `metadataAction/`,
`actionModifiers/`, `customForms/`, `customFormatter/`, `link/`,
`globalFilters/`, `multipleHistoricalSessions/`, `realtimeSessions/`,
`messageStreamProcessor/`, `channelLimits/`, `formats/`, `time/`.

Shared: `utils/` (aliased `ommUtils`), `lib/`, `tables/`, `styles/`.

### Key services and patterns

- **MIO client** (`services/mcws/mcws.js`, `MCWSClient.js`): all MCWS
  traffic goes through `mcws.dataTable(url, {signal})`,
  `mcws.namespace(url)`, `mcws.opaqueFile(url)`. `MCWSClient` prepends
  `mcwsUrl`, applies the `proxyUrl` rewrite, and sends with
  `credentials: 'include'`. Never `fetch` MCWS directly.
- **Query serialization** (`MCWSParameters.js`): `filter` objects become
  `(k=v,k2!=v2,k3>=v3,k4=(a,b))`, `sort` becomes `(field,-other)`,
  `select` becomes `(col1,col2)`. Datatable reads force `output=json`.
- **Dataset URLs**: telemetry domain objects carry backend URLs
  (`channelHistoricalUrl`, `evrStreamUrl`, ...). Providers read the URL
  off the object; never hardcode endpoints.
- **Sessions** (`SessionService`): topics/sessions come from
  `sessionLADUrl`/`sessionUrl`. Use `getActiveTopicOrSession()` /
  `listen()` / `getTopicsWithSessions()` / `getHistoricalSessions()` —
  never invent parallel session plumbing.
- **Realtime**: extend `MCWSStreamProvider` with `getUrl`/`getKey`/
  `getProperty`; the shared worker owns topic subscription, the
  `?filter=(session,topic,prop)` query string, reconnect, and fan-out.
  EVR stream keys (`module`) must be UPPERCASE.
- **Command dictionary** (this branch): `Dataset.commands` loads the
  plandev-ampcs JSON file once via `commandDictionaryUrl` and serves
  stems/arguments from memory. Consumers read the in-memory copy;
  nothing queries per action.

## Creating a new sub-plugin

### 1. Scaffold `src/<name>/plugin.js`

```javascript
export default function MyPlugin(options) {
  return function install(openmct) {
    openmct.telemetry.addProvider(new MyProvider(openmct, options));
  };
}
```

Both `openmct.install(MyPlugin(opts))` and `openmct.install(new
MyPlugin(opts))` appear in this repo; prefer the plain factory-call form
for new code.

### 2. Register capabilities

| Capability | API | Local example |
| --- | --- | --- |
| Historical/realtime telemetry | `openmct.telemetry.addProvider(...)` | `historical/`, `realtime/` |
| Object type | `openmct.types.addType(...)` | `types/` (`VISTAType`) |
| Object view | `openmct.objectViews.addProvider(...)` | `evrView/`, `alarmsView/` |
| Indicator | `openmct.indicators.add(...)` | `mcwsIndicator/` |
| Format | `openmct.telemetry.addFormat(...)` | `formats/`, `types/plugin.js` |
| Composition | `openmct.composition.addProvider/addPolicy(...)` | `types/`, `taxonomy/` |
| Interceptor | `openmct.objects.add*Interceptor(...)` | `persistence/`, core `clock` plugin |
| Action | `openmct.actions.register(...)` | `exportDataAction/` |
| Object provider / roots | `openmct.objects.addProvider/addRoot(...)` | `persistence/` |
| User provider | `openmct.user.setProvider(...)` | `services/identity/` |

Consult [API.md](https://github.com/nasa/openmct/blob/master/API.md)
sections (Types, Plugins, Telemetry API, Time API, Indicators) before
using a core API in a new way.

### 3. Wire it into the root plugin

Import in [plugin.js](plugin.js) and `openmct.install(...)` it with the
narrowest config slice it needs. Order matters only for services:
`SessionService`/`DatasetCache`/`GlobalStaleness` and
`mcwsClient.configure(config)` must run before providers that use them.

### 4. Add config (all four places)

1. `defaultConfig` in [plugin.js](plugin.js).
2. [CONFIGURATION.md](CONFIGURATION.md) with recipe + JSON examples.
3. [mcws-config.example.json](mcws-config.example.json).
4. Read it at runtime from `window.openmctMCWSConfig` (audit is automatic).

### 5. Telemetry specifics

Provider contract (per API.md): `supportsRequest`/`request` (historical,
promise of datums sorted ascending by domain),
`supportsSubscribe`/`subscribe` (realtime, callback per datum, return a
fresh unsubscribe function), `supportsMetadata`/`getMetadata`,
`supportsLimits`/`getLimitEvaluator`. Implement only what the object
needs; mcws splits historical, realtime, and metadata across providers.

mcws extensions: `batchId`/`batchRequest` for batched channel queries
(gated by `batchHistoricalChannelQueries`), `exclusiveDomains`
(command events bind `ert`), `minmax` strategy → `channelMinMaxUrl`,
`latest` strategy / `size === 1` → LAD URLs. Shared helpers live in
`src/utils/utils.js`: `groupBy`, `keyBy`, `setMaxResults`,
`setSortFilter`, `isLADQuery`.

### 6. Views and UI

View providers implement `canView`/`view` (see `evrView/`); table-style
views accept `tablePerformanceOptions`. Vue 3 SFCs; indicators mount via
`ommUtils/mountVueComponent.js` (see `mcwsIndicator/`). Styles go through
the `vista.scss` chain — no global CSS leaks. For show/hide behavior see
"Visibility-Based Rendering" in API.md.

### 7. Tests and docs

Add a colocated `*Spec.js` (see Tests below), document new options as in
step 4, and add domain words to the spell dictionary rather than
misspelling around them.

## Conventions and pitfalls

- ESM only. No lodash: files carry small local helpers (`sortBy`,
  `keyBy`, `groupBy`) — reuse `src/utils/utils.js` instead of adding a
  dependency.
- Import aliases (webpack): `services/*`, `types/*`, `lib/*`,
  `tables/*`, `ommUtils/*` (→ `src/utils/`), plus `openmct.tables.*`
  shims for extending core table classes. `@` reaches into openmct core
  source; it carries a FIXME — avoid new uses.
- `window.openmctMCWSConfig` is the runtime config source of truth;
  `window.openmctMCWSConfigurationAudit.sources['dotted.path']` says
  where a value came from.
- Plumb `AbortSignal` (`options.signal`) into every `mcws.*.read()` so
  cancelled queries abort; suppress `AbortError` like `MIO.request` does.
- Realtime subscriptions must return a new unsubscribe function per
  subscriber; subscription setup is debounced via
  `subscriptionMCWSFilterDelay`.
- Time systems are `scet`/`ert` (+ utc); day-of-year UTC formats live in
  `formats/`. EVR levels/colors come from `config.taxonomy`.
- `mcws-proxy-api/openapi.yaml` documents the proxy backend contract
  (telemetry, commanding, sessions, queues, transfers, catalog, OIDC
  roles). Backend-facing work must match it; fix the spec first when the
  contract needs to change.
- Disclose agent involvement with an `Assisted-by:` commit trailer naming
  the tool.

## Commands

Engines: `node >= 24.14.1`. Install with `npm install`.

- `npm start` — webpack dev server (`.webpack/webpack.dev.js`).
- `npm run build:prod` / `build:dev` / `build:watch` — webpack builds.
- `npm run lint` — eslint over the repo; `lint:fix` auto-fixes.
- `npm run lint:spelling` — cspell over js/md/vue (config:
  `.cspell.json`, words in `.cspell/`).
- `npm test` — Karma + Jasmine single run in headless Chrome; specs are
  `src/**/*Spec.js` (colocated `*Spec.js`, plus existing `pluginSpec.js`
  and `test/` layouts). To run one suite, temporarily prefix the
  relevant `describe`/`it` with `f` (Jasmine focused mode), then
  remove before committing. There is no e2e
  suite in this repo (unlike core).

## Review checklist for agents

- New capability registered through the openmct API (not wired around it)?
- Root [plugin.js](plugin.js) imports and installs it with a minimal config slice?
- Option defaulted, documented in CONFIGURATION.md + example JSON?
- `*Spec.js` covers the new path (provider `supports*`, URL/param building, worker query strings, state transitions)?
- `npm run lint` and `npm run lint:spelling` clean?
- Core API usage checked against API.md and the `openmct@4.3.1` peer (not core master)?
- No hardcoded backend URLs, no unfocused test helpers left behind, no per-action dictionary queries?

## Core openmct pointers

The plugin pattern here is identical to core's (`ClockPlugin(options)` →
`install(openmct)` in `src/plugins/clock/plugin.js`). Useful reference
implementations among the 69 core plugins: `clock` (minimal
type + view + indicator), `telemetryTable` / `LADTable` (table consumers
this repo's views feed), `plot` (telemetry consumer conventions),
`persistence` / `localStorage` (object-provider patterns),
`condition` / `conditionWidget` (evaluated views). Core `src/MCT.js`
lists every API surface (`telemetry`, `objects`, `composition`, `time`,
`types`, `actions`, `user`, `editor`, `router`, ...).
