# MCWS Plugin for Open MCT
MCWS Plugin for Open MCT is a package that allows Open MCT to use MCWS (Mission Control Web Services) as a telemetry and persistence provider.

Open Mission Control Technologies, or [Open MCT](https://github.com/nasa/openmct), is a next-generation web-based mission control and situational awareness framework, for visualization of data on desktop and mobile devices. Open MCT is developed at NASA Ames Research Center in Silicon Valley, in collaboration with NASA AMMOS and the Jet Propulsion Laboratory, California Institute of Technology (under its contract with NASA, 80NM0018D0004).

## Installation

### Installing Open MCT with the Build Tool
Follow instructions to install the [Open MCT Build Tool](https://github.com/akhenry/openmct-build) (requires access request). The MCWS Plugin is then included and customized in build tool configuration.

#### Installing MCWS Plugin via Build Tool command line
1. Add the plugin
Example:
```bash
mct plugins add openmct-mcws-plugin --options '{"mcwsUrl": "<mcws_url>", "namespaces": [{"key": "my-instance", "name": "Shared", "url": "<shared_persistence_url>"}, {"key": "my-instance", "name": "Users", "url": "<user_persistence_url>", "userNamespace": true}]}'
```

2. Configure Open MCT
Example:
```bash
mct plugins configure openmct.plugins.DisplayLayout --options '{"showAsView": ["summary-widget", "vista.packetSummaryEvents", "vista.dataProducts", "vista.packets", "vista.frameSummary", "vista.frameWatch"]}'
mct plugins configure openmct.plugins.Filters --options '["vista.alarmsView", "vista.chanTableGroup", "vista.commandEventsView", "vista.messagesView", "vista.evrView"]'
```

3. Build Open MCT
Example:
```bash
mct build
```

To deploy to Tomcat, package the built instance folder as a WAR; see [Tomcat Web Application Deployments](#tomcat-web-application-deployments).

#### Installing MCWS Plugin via Build Tool recipe
1. Specify a pre-configured recipe to build (from the openmct-build directory)
Example:
```bash
mct build --recipe recipes/mcws/prod.yaml --instance prod-instance
```
<details>
  <summary>Example <code>prod.yaml</code></summary>

  ```yaml
  # yaml-language-server: $schema=../../src/assets/openmct-configuration-schema.json
  # Builds Open MCT for MCWS without dev plugins enabled. Requires an MCWS server to connect to.
  openmct:
    version: latest 
    plugins:
    - openmct.plugins.Snow # Theme: 'Snow', 'Espresso' or 'Maelstrom'
    - openmct.plugins.ObjectMigration
    - openmct.plugins.ClearData:
        options:
          - ['table', 'telemetry.plot.overlay', 'telemetry.plot.stacked', 'vista.packetSummaryEvents', 'vista.dataProducts', 'vista.packets', 'vista.frameSummary', 'vista.frameWatch', 'vista.chanTableGroup']
          - indicator: false
    - openmct.plugins.DisplayLayout:
        options:
          showAsView:
            - summary-widget
            - vista.packetSummaryEvents
            - vista.dataProducts
            - vista.packets
            - vista.frameSummary
            - vista.frameWatch
    - openmct.plugins.Filters:
        options:
          - - vista.alarmsView
            - telemetry.plot.overlay
            - table
            - vista.chanTableGroup
            - vista.commandEventsView
            - vista.messagesView
            - vista.evrView
    - openmct.plugins.UTCTimeSystem
    - openmct.plugins.Notebook
    - openmct.plugins.Clock:
        options:
          useClockIndicator: false
    - openmct.plugins.DefaultRootName:
        options: ['VISTA']
    - openmct-mcws-plugin:
        npmPackage: openmct-mcws-plugin
        options:
          useDeveloperStorage: false
          mcwsUrl: ''
          namespaces:
            - key: 'r50-dev'
              name: 'R5.0 Shared'
              url: ''
            - userNamespace: true
              key: 'r50-dev'
              name: 'R5.0 Users'
              url: ''
  ```
  *The recipe example above shows typical build-time values, not the plugin’s built-in defaults.*
</details>

### AMMOS configurations
1. `mcwsUrl`: The url to the MCWS server.
2. In the `namespaces` configuration, `url`, the path to the MCWS persistence spaces, are required.

## Configuration
Plugin settings are merged in this order (highest precedence first):
1. **`mcws-config.json`**: optional file at the root of the built Open MCT instance (runtime). Release artifacts include `mcws-config.example.json`; copy or rename it to `mcws-config.json` and set values you want to override.
2. **Build-tool recipe / plugin options**: set when building with `mct` (see examples above).
3. **Plugin defaults**: defined in code in the `defaultConfig` object in [`plugin.js`](plugin.js).

For descriptions of all supported options, see [`CONFIGURATION.md`](CONFIGURATION.md).

### Configuration audit

After the plugin loads, the merged config is available on `window.openmctMCWSConfig`. To see **where each value came from**, use `window.openmctMCWSConfigurationAudit`:

- **`runtime`** — values from `mcws-config.json`
- **`build`** — values from build-tool recipe / plugin options
- **`default`** — values from plugin defaults in [`plugin.js`](plugin.js)
- **`derived`** — values computed at load time (e.g. `useDeveloperStorage`)
- **`sources`** — flat lookup of dotted paths to source name (e.g. `sources['time.defaultMode']` → `'default'`)

Example (browser console):

```javascript
openmctMCWSConfigurationAudit.sources.mcwsUrl
openmctMCWSConfigurationAudit.runtime
openmctMCWSConfigurationAudit.build
```

## Legacy workflow (deprecated)
This repository still includes a legacy standalone app entry point (`index.html`, `config.js`, `legacy-index.js`) for local development and WAR packaging. This will be removed in the future.

Edit `config.js` to set `window.openmctMCWSConfig` (all plugin options). Run `npm install`, build with `npm run build:prod` and run with `npm start`, or package with Maven for Tomcat.

For new deployments, prefer the [Open MCT Build Tool](https://github.com/akhenry/openmct-build) with optional runtime `mcws-config.json` (see Configuration above).
The [legacy branch](https://github.com/NASA-AMMOS/openmct-mcws/tree/legacy) contains the previous combined Open MCT + MCWS product layout.

## Connecting to MCWS

### Installing MCWS
MCWS is a closed source product in the [Advanced Multi-Mission Operations System (AMMOS)](https://ammos.nasa.gov/) catalog. Contact someone at [AMMOS](https://ammos.nasa.gov/contact/) for instructions how to install MCWS.

[MCWS](https://github.com/NASA-AMMOS/MCWS) is the open source repository for MCWS. MCWS will become open source once all closed source dependencies are purged or made to be open source as well.

### Running a mock MCWS server
[Mock MCWS server](https://github.com/davetsay/mcws-test-server) (requires access request)

## Tomcat Web Application Deployments
Open MCT can be deployed to [Tomcat](https://tomcat.apache.org/tomcat-9.0-doc/deployer-howto.html) as a WAR. How you create the WAR depends on whether you used the build tool or the legacy workflow in this repository.

### Build-tool instances (recommended)
After building with `mct`, package the **entire built instance directory** as the WAR webapp root. That directory (for example `openmct-build/instances/prod-instance/`) should contain at least:
- `index.html`
- `assets/`
- `node_modules/`
- optional `mcws-config.json` (if using runtime overrides; see [Configuration](#configuration))

Add or edit `mcws-config.json` in the instance folder if needed, then create the WAR:
```bash
cd /path/to/openmct-build/instances/testing
jar -cvf openmct_client.war .
```

## Contacts
Jamie Vigliotta (jamie.j.vigliotta@nasa.gov), David Tsay (david.e.tsay@nasa.gov)

Or join us on [Slack](https://jpl.slack.com/app_redirect?channel=openmct)
