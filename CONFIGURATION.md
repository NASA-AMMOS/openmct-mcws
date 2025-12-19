# Plugin Options Recipe Example
When including the Open MCT for MCWS Plugin into your Open MCT project, the following are available configuration options.
```yaml
- openmct-mcws-plugin:
  npmPackage: NASA-AMMOS/openmct-mcws#omm-plugin
  options:
    camUrl: ''
    mcwsUrl: http://localhost:8090/mcws-test
    namespaces:
      - key: 'r50-dev'
        name: 'R5.0 Shared'
        url: ''
      - userNamespace: true
        key: 'r50-dev'
        name: 'R5.0 Users'
        url: ''
    theme: 'Snow'
    venueAware:
      enabled: false
      venues: 'ExampleVenueDefinitions.json'
    taxonomy:
      evrDefaultBackgroundColor: null
      evrDefaultForegroundColor: null
      evrBackgroundColorByLevel:
        FATAL: '#ff0000'
        WARNING_HI: '#ff7f24'
        WARNING_LO: '#ffff00'
        COMMAND: '#00bfff'
        ACTIVITY_HI: '#6d6d6d'
        ACTIVITY_LO: '#dcdcdc'
        DIAGNOSTIC: '#00ff00'
        EVR_UNKNOWN: '#00ff00'
        FAULT: '#ff0000'
        WARNING: '#ff7f24'
      evrForegroundColorByLevel:
        FATAL: '#ffffff'
        WARNING_HI: '#000000'
        WARNING_LO: '#000000'
        COMMAND: '#ffffff'
        ACTIVITY_HI: '#ffffff'
        ACTIVITY_LO: '#000000'
        DIAGNOSTIC: '#000000'
        EVR_UNKNOWN: '#000000'
        FAULT: '#ffffff'
        WARNING: '#000000'
    time:
      defaultMode: 'fixed'
      utcFormat: 'utc.day-of-year'
      lmstEpoch: null
      subscriptionMCWSFilterDelay: 100
      timeSystems: ['scet', 'ert']
      allowRealtime: true
      allowLAD: true
      records: 10
    maxResults: 10000
    sessionHistoricalMaxResults: 100
    batchHistoricalChannelQueries: false
    disableSortParam: false
    messageStreamUrl: ''
    messageTypeFilters: []
    frameAccountabilityExpectedVcidList: []
    queryTimespanLimit: null
    globalStalenessInterval: null
    customFormatters: []
    sessions:
      historicalSessionFilter:
        disable: false
        maxRecords: 100
        denyUnfilteredQueries: false
      realtimeSession:
        disable: false
    globalFilters: []
    tablePerformanceOptions:
      telemetryMode: 'unlimited'
      persistModeChange: false
      rowLimit: 50
    useDeveloperStorage: true
    proxyUrl: 'http://localhost:8080/'
    assetPath: 'node_modules/openmct/dist'
```

# Configuration Guide

## Required Options

#### `camUrl`
- **Type**: `string`
- **Required**: Yes
- **Description**: URL to the CAM server this instance uses for authentication.

#### `mcwsUrl`
- **Type**: `string`
- **Required**: Yes
- **Description**: URL for MCWS root.

#### `namespaces`
- **Type**: `array`
- **Required**: Yes
- **Description**: Each entry adds a root folder to the object tree.

**Namespace Properties:**
- `key` (string, required): Unique key for this namespace.
- `name` (string, required): User-visible name for this namespace.
- `url` (string, required): URL to MCWS namespace which will store the contents of the namespace.
- `userNamespace` (boolean, optional, defaults to `false`): If `true`, this namespace will be used to create per-user folders.


## Basic Configuration

### Theme

#### `theme`
- **Type**: `string`
- **Default**: `'Snow'`
- **Options**: `'Snow'`, `'Espresso'`, or `'Maelstrom'`
- **Description**: Sets the theme for the Open MCT interface.

### Venue Aware Configuration

#### `venueAware`
- **Type**: `object`
- **Added in**: R4.0
- **Description**: Options here enable venue aware mode and allow configuration of venue aware mode. Venue aware configuration allows pre-configuration with a list of venues and datasets such that users are prompted to select either an active venue or a historical session that they'd like to review. Enabling venue-aware mode disables manual creation of datasets.

**Properties:**
- `enabled` (boolean): Enable or disable venue aware mode. Options: `true`, `false`.
- `venues` (string or array): Either a list of venue definitions or a URL for a JSON venue definition file. If a URL is provided, it will be queried at run time to determine the venues available. An example of a JSON venue definition file is provided in "ExampleVenueDefinitions.json".

### Taxonomy Configuration

#### `taxonomy`
- **Type**: `object`
- **Description**: Options here affect how various telemetry types are displayed.

**Properties:**
- `evrDefaultBackgroundColor` (string or `null`): Default background color for EVRs. Set to `null` to use the theme default. Otherwise, specify a hex string for an RGB color, e.g. `#ababab`.
- `evrDefaultForegroundColor` (string or `null`): Default foreground color for EVRs. Set to `null` to use the theme default. Otherwise, specify a hex string for an RGB color, e.g. `#ababab`.
- `evrBackgroundColorByLevel` (object): Specify the background color of EVRs by level. If a level is not defined here, it will use the default specified above. Keys are specific EVR levels, and values must be a hex string for an RGB color, e.g. `#ababab`.
  - Supported levels (FSW Specific): `FATAL`, `WARNING_HI`, `WARNING_LO`, `COMMAND`, `ACTIVITY_HI`, `ACTIVITY_LO`, `DIAGNOSTIC`, `EVR_UNKNOWN`
  - Supported levels (SSE Specific): `FAULT`, `WARNING`
- `evrForegroundColorByLevel` (object): Specify the foreground color of EVRs by level. If a level is not defined here, it will use the default specified above. Keys are specific EVR levels, and values must be a hex string for an RGB color, e.g. `#ababab`.
  - Supported levels (FSW Specific): `FATAL`, `WARNING_HI`, `WARNING_LO`, `COMMAND`, `ACTIVITY_HI`, `ACTIVITY_LO`, `DIAGNOSTIC`, `EVR_UNKNOWN`
  - Supported levels (SSE Specific): `FAULT`, `WARNING`

### Time Configuration

#### `time`
- **Type**: `object`
- **Description**: Settings for time APIs and formats.

**Properties:**
- `defaultMode` (string): Default conductor mode. Available options:
  - `'fixed'`: Fixed time bounds.
  - `'utc.local'`: Follow local UTC clock. Only available when `allowRealtime` is `true` and `scet` or `ert` timeSystems are available.
  - `'scet.lad'`: Follow latest scet seen in telemetry data. Only available when `allowLAD` is `true` and `scet` timeSystem is enabled.
  - `'ert.lad'`: Follow latest ert seen in telemetry data. Only available when `allowLAD` is `true` and `ert` timeSystem is enabled.
  - `'sclk.lad'`: Follow latest sclk seen in telemetry data. Only available when `allowLAD` is `true` and `sclk` timeSystem is enabled.
  - `'msl.sol.lad'`: Follow latest mslsol seen in telemetry data. Only available when `allowLAD` is `true` and `mslsol` timeSystem is enabled.
- `utcFormat` (string): Available options:
  - `'utc.day-of-year'`: Format as `2015-015T12:34:56.999`
  - `'utc'`: Format as `2015-01-15T12:34:56.999`
- `lmstEpoch` (number or `null`): Epoch date for LMST Time System. It has to be a Date.UTC instance, e.g. `Date.UTC(2020, 2, 18, 0, 0, 0)`. Note: In YAML, this would need to be converted to a timestamp number.
- `subscriptionMCWSFilterDelay` (number): Delay in milliseconds for combining filters for the same subscription endpoint connection. Smaller value = quicker display of realtime data (e.g., 10ms in a low latency environment). Higher value = avoids potentially creating and subsequently tearing down new websocket connections if filter changes are happening faster than server response times (e.g., 100ms+ in a high latency environment).
- `timeSystems` (array or array of objects): Specify the time systems to use. Options are `'scet'`, `'ert'`, `'sclk'`, `'msl.sol'` and `'lmst'`.
  
  **Basic Configuration**: Simple array of time system keys, e.g. `['scet', 'ert']`.
  
  **Advanced Configuration**: Array of objects with timeSystem-specific configurations:
  - `key` (string, required): Time system. Options are `'scet'`, `'ert'`, `'sclk'`, `'msl.sol'` and `'lmst'`.
  - `limit` (number, optional): Maximum duration between start and end bounds allowed (in milliseconds).
  - `modeSettings` (object, optional): Presets for convenience.
    - `fixed` (object, optional): Valid objects are `bounds` objects and `presets` array.
      - `bounds` (object, optional): Start and end bounds for preset as numbers. `start` and `end` can be declared as a number or a function returning a number.
      - `presets` (array, optional): Array of objects consisting of:
        - `bounds` (object, required): Start and end bounds.
        - `label` (string, required): Label for the preset.
    - `realtime` (object, optional): Valid objects are `clockOffsets` and `presets` array.
      - `clockOffsets` (object, optional): Start and end relative to active clock. `start` and `end` are numbers relative to active clock's 0. Start is negative, end is positive.
      - `presets` (array, optional): Array of preset objects with `bounds` and `label`.
    - `lad` (object, optional): Valid objects are `clockOffsets`.
      - `clockOffsets` (object, optional): Start and end relative to active clock. `start` and `end` are numbers relative to active clock's 0. Start is negative, end is positive.
- `allowRealtime` (boolean): Whether or not to allow UTC-relative time conductor.
- `allowLAD` (boolean): Whether or not to allow latest data relative time conductor. **Note**: `allowRealtime` must be `true` to use this option.
- `records` (number): Number of previous bounds per timeSystem to save in time conductor history.

### Query Configuration

#### `maxResults`
- **Type**: `number`
- **Optional**: Yes
- **Description**: A maximum results limit for historical queries.

#### `sessionHistoricalMaxResults`
- **Type**: `number`
- **Default**: `100`
- **Description**: A maximum results limit for historical session queries.

#### `batchHistoricalChannelQueries`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Set to `true` to batch channel historical queries in telemetry tables.
- **Warning**: **USE WITH CAUTION** - You can more easily overwhelm the backend with a larger single query.

#### `disableSortParam`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Enable to not send sort param in historical queries. Only set this configuration to `true` if you are certain you wish to disable backend sort.

#### `queryTimespanLimit`
- **Type**: `number` or `null`
- **Default**: `null`
- **Description**: Use to warn the user and block historical query when the ert, scet or lmst based time-conductor timespan exceeds set limits. Units are in milliseconds. When set to `null`, user will not be warned and queries will not be blocked.

### Message and Frame Configuration

#### `messageStreamUrl`
- **Type**: `string`
- **Default**: `''`
- **Description**: URL used to listen to message stream for StartOfSession and EndOfSession messages.

#### `messageTypeFilters`
- **Type**: `array`
- **Default**: `[]`
- **Description**: Use to set mission specific filters on messages by message type.

**Filter Object Properties:**
- `value` (string): Message type code value.
- `label` (string): User-visible label for identifying this filter option.

**Example:**
messageTypeFilters:
  - value: 'LossOfSync'
    label: 'Loss of Sync'
  - value: 'InSync'
    label: 'In Sync'

#### `frameAccountabilityExpectedVcidList`
- **Type**: `array`
- **Default**: `[]`
- **Description**: Use to set up expected VCID's in the frame event stream. Frame Accountability View will highlight the unexpected VC's in orange.

**Example:**
frameAccountabilityExpectedVcidList:
  - 234223
  - 234234
  - 223423

### Staleness Configuration

#### `globalStalenessInterval`
- **Type**: `number` or `null`
- **Default**: `null`
- **Description**: Time since last received realtime datum. Any datum that is received after the set timespan will have a stale (`isStale`) property set. Units are in milliseconds. When set to `null`, there will be no global staleness timespan set.

### Custom Formatters

#### `customFormatters`
- **Type**: `array`
- **Default**: `[]`
- **Description**: Register custom formatters for use in Telemetry View in Display Layout's. Custom Formatters need to be an object with a unique String `key` property and a `format` function that accepts a value and returns formatted value. Custom formatters can be accessed in Display Layout's format inspector view, with a pre-pended `&`, e.g. the `'hello-world'` formatter can be accessed by `&hello-world`.

**Note**: In YAML, functions cannot be directly represented. You would need to define these in JavaScript code that processes the YAML configuration.

**Example Structure:**
customFormatters:
  - key: 'hello-world'
    # format function would need to be defined in JavaScript

### Session Configuration

#### `sessions`
- **Type**: `object`
- **Description**: Use to set deployment specific session configuration.

**Properties:**
- `historicalSessionFilter` (object): Configuration for historical session filtering.
  - `disable` (boolean): To disable historical session filtering.
  - `maxRecords` (number): A number greater than 0, for maximum historical session records to be returned.
  - `denyUnfilteredQueries` (boolean): Whether to deny unfiltered queries.
- `realtimeSession` (object): Configuration for realtime sessions.
  - `disable` (boolean): To disable realtime sessions. **Note**: This will disable all websocket connections.

### Global Filters

#### `globalFilters`
- **Type**: `array`
- **Optional**: Yes
- **Description**: Enable global filters for ALL telemetry requests that support the filter. Telemetry filters modify the `filter` field in queries to MCWS.

**How to use:**
The global filters will be available from the Global Filters indicator. Enable a filter by selecting the desired filter from the dropdown and hitting update. Outgoing requests that use the `filter` parameter to MCWS will be modified with your filter. For example, selecting 'A side' will ensure that the filter parameter in MCWS includes: `vcid='1,2,3'`. Note that poorly formatted filters may not pass MCWS API validation.

**Filter Object Properties:**
- `key` (string, required): Filter column, e.g. `vcid`.
- `name` (string, required): Identifier of the filter in the selection window.
- `icon` (string, optional): Icon identifier, e.g. `'icon-flag'`. Not implemented - potentially icon for minimized filter list.
- `filter` (object, required): Filter object to implement.
  - `comparator` (string, required): Currently supports `'equals'`.
  - `singleSelectionThreshold` (boolean, required): Currently supports `true` only.
  - `defaultLabel` (string, optional): Defaults to `'None'`. Label to show if filter inactive.
  - `possibleValues` (array, required): List of values and labels for filter.
    - `label` (string, required): Label to show in filter selection dropdown.
    - `value` (string, required): Value to set parameter to in filtered query.

**Example:**
globalFilters:
  - name: 'VCID'
    key: 'vcid'
    icon: 'icon-flag'
    filter:
      comparator: 'equals'
      singleSelectionThreshold: true
      defaultLabel: "A & B"
      possibleValues:
        - label: 'A Side'
          value: '1,2,3'
        - label: 'B Side'
          value: '4,5,6'
  - name: 'Realtime'
    key: 'realtime'
    filter:
      comparator: 'equals'
      singleSelectionThreshold: true
      defaultLabel: "REC & RLT"
      possibleValues:
        - label: 'Realtime'
          value: true
        - label: 'Recorded'
          value: false

### Telemetry Table Performance Configuration

#### `tablePerformanceOptions`
- **Type**: `object`
- **Description**: Table Performance Mode Configuration. Can increase performance by limiting the maximum rows retained and displayed by tables. Affects all bounded table types such as Telemetry and EVR tables. Does not affect latest available tables such as Channel tables.

**Properties:**
- `telemetryMode` (string): Performance mode limits the maximum table rows. Options: `'performance'`, `'unlimited'`.
- `persistModeChange` (boolean): Whether changes in the UI are persisted with the table.
- `rowLimit` (number): The maximum number of rows in performance mode.

### Developer Settings

**Warning**: Do not modify these unless you know what they do!

#### `proxyUrl`
- **Type**: `string`
- **Default**: `'http://localhost:8080/'`
- **Description**: Developer setting for proxy URL.

#### `useDeveloperStorage`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Developer setting - enables developer storage mode. Do not modify unless you know what it does.

#### `assetPath`
- **Type**: `string`
- **Default**: `'node_modules/openmct/dist'`
- **Description**: Developer setting for asset path.
