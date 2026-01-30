# MCWS Plugin for Open MCT
MCWS Plugin for Open MCT is a package that allows Open MCT to use MCWS (Mission Control Web Services) as a telemetry and persistence provider.

Open Mission Control Technologies, or [Open MCT](https://github.com/nasa/openmct), is a next-generation web-based mission control and situational awareness framework, for visualization of data on desktop and mobile devices. Open MCT is developed at NASA Ames Research Center in Silicon Valley, in collaboration with NASA AMMOS and the Jet Propulsion Laboratory, California Institute of Technology (under its contract with NASA, 80NM0018D0004).

# Getting Started and Installation Instructions
Installing the MCWS Plugin with Open MCT requires building Open MCT using the [Open MCT Build Tool](https://github.com/akhenry/openmct-build) (requires access request).

_To build Open MCT for MCWS, the legacy product that combines Open MCT and the MCWS Plugin, see the [legacy branch](https://github.com/NASA-AMMOS/openmct-mcws/tree/legacy)._

## Building Open MCT using the MCWS Plugin
Open MCT is built using the [Open MCT Build Tool](https://github.com/akhenry/openmct-build) (requires access request). The MCWS Plugin is then included and customized in build tool configuration.

### Installing the Build Tool
Install the [Open MCT Build Tool](https://github.com/akhenry/openmct-build) (requires access request). Therein contains instructions for how to use and configure Open MCT using the build tool.

### MCWS Plugin via Build Tool command line
```bash
mct plugins add openmct-mcws-plugin -i my-mcws-instance 
mct build
```

### MCWS Plugin via Build Tool recipe
```bash
mct build openmct-mcws.yaml
```

openmct-mcws.yaml
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

## Connecting to MCWS

### Installing MCWS
MCWS is a closed source product in the [Advanced Multi-Mission Operations System (AMMOS)](https://ammos.nasa.gov/) catalog. Contact someone at [AMMOS](https://ammos.nasa.gov/contact/) for instructions how to install MCWS.

[MCWS](https://github.com/NASA-AMMOS/MCWS) is the open source repository for MCWS. MCWS will become open source once all closed source dependencies are purged or made to be open source as well.

### Running a mock MCWS server
[Mock MCWS server](https://github.com/davetsay/mcws-test-server) (requires access request)

## Tomcat Web Application Deployments
For [Tomcat Web Application Deployments](https://tomcat.apache.org/tomcat-9.0-doc/deployer-howto.html), [Maven](https://maven.apache.org/guides/getting-started/maven-in-five-minutes.html) can be used to generate a `.war` file.

# Maintainers
Jamie Vigliotta (jamie.j.vigliotta@nasa.gov)
David Tsay (david.e.tsay@nasa.gov)