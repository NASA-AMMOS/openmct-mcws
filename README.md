# MCWS Plugin for Open MCT
MCWS Plugin for Open MCT is a package that allows Open MCT to use MCWS (Mission Control Web Services) as a telemetry and persistence provider.

Open Mission Control Technologies, or [Open MCT](https://github.com/nasa/openmct), is a next-generation web-based mission control and situational awareness framework, for visualization of data on desktop and mobile devices. Open MCT is developed at NASA Ames Research Center in Silicon Valley, in collaboration with NASA AMMOS and the Jet Propulsion Laboratory, California Institute of Technology (under its contract with NASA, 80NM0018D0004).

# Installation

## Installing Open MCT with the Build Tool
Follow instructions to install the [Open MCT Build Tool](https://github.com/akhenry/openmct-build) (requires access request). The MCWS Plugin is then included and customized in build tool configuration.

### Installing MCWS Plugin via Build Tool command line
1. Add the plugin
Example:
```bash
mct plugins add openmct-mcws-plugin --options '{"mcwsUrl": "<mcws_url>", "namespaces": [{"key": "shared", "name": "Shared", "url": "<persistence_url>"}, {"key": "shared", "name": "Shared", "url": "<persistence_url>"}]}'
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

### Installing MCWS Plugin via Build Tool recipe
1. Specify a pre-configured recipe to build
Example:
```bash
mct build openmct-mcws.yaml
```

Example `openmct-mcws.yaml`:
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
        camUrl: ''
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

### AMMOS configurations
1. `camUrl`: The url to the CAM server, if CAM is to be used for authentication.
2. `mcwsUrl`: The url to the MCWS server.
3. In the `namespaces` configuration, `url`, the path to the MCWS persistence spaces, are required.

Further configuration documentation can be found in the `CONFIGURATION.md`.

## Installing Open MCT for MCWS (Legacy)
_To build Open MCT for MCWS, the legacy product that combines Open MCT and the MCWS Plugin, see the [legacy branch](https://github.com/NASA-AMMOS/openmct-mcws/tree/legacy)._

## Connecting to MCWS

### Installing MCWS
MCWS is a closed source product in the [Advanced Multi-Mission Operations System (AMMOS)](https://ammos.nasa.gov/) catalog. Contact someone at [AMMOS](https://ammos.nasa.gov/contact/) for instructions how to install MCWS.

[MCWS](https://github.com/NASA-AMMOS/MCWS) is the open source repository for MCWS. MCWS will become open source once all closed source dependencies are purged or made to be open source as well.

### Running a mock MCWS server
[Mock MCWS server](https://github.com/davetsay/mcws-test-server) (requires access request)

## Tomcat Web Application Deployments
For [Tomcat Web Application Deployments](https://tomcat.apache.org/tomcat-9.0-doc/deployer-howto.html), [Maven](https://maven.apache.org/guides/getting-started/maven-in-five-minutes.html) can be used to generate a `.war` file.

# Contacts
Jamie Vigliotta (jamie.j.vigliotta@nasa.gov)
David Tsay (david.e.tsay@nasa.gov)

Or join us on [Slack](https://jpl.slack.com/app_redirect?channel=openmct)
