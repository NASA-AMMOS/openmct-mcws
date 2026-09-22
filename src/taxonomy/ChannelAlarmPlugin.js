import types from '../types/types.js';

const VIEW_HISTORICAL_DATA_ACTION_KEY = 'viewHistoricalData';

// The Red/Yellow/Any Alarms nodes render via OpenMCT's stock 'table' view, which is
// registered (and its TelemetryTableRow instances constructed) entirely inside core's
// own bundle -- not ours. Patching a TelemetryTableRow class we import here only patches
// our own bundle's copy, which core's stock view never touches, so the row-level
// getContextualDomainObject extension point used elsewhere (see AlarmsViewHistoricalContextTableRow)
// can't reach it here. Instead, patch the *live* viewHistoricalData action instance via the
// shared openmct.actions registry: when it's invoked against a vista.channel.alarmNode
// (the one telemetry object backing the whole alarm table, not a specific channel), pull the
// clicked row's datum via the view context and redirect to the channel named in its channel_id.
function patchViewHistoricalDataForChannelAlarms(openmct, cache) {
  const action = openmct.actions.getAction(VIEW_HISTORICAL_DATA_ACTION_KEY);

  if (!action || action.patchedForChannelAlarms) {
    return;
  }

  const baseInvoke = action.invoke.bind(action);

  action.invoke = function (objectPath, view) {
    const domainObject = objectPath && objectPath[0];

    if (!domainObject || domainObject.type !== 'vista.channel.alarmNode') {
      return baseInvoke(objectPath, view);
    }

    const viewContext = (view && view.getViewContext && view.getViewContext()) || {};
    const datum = viewContext.row && viewContext.row.getDatum && viewContext.row.getDatum();
    const channelId = datum && datum.channel_id;

    if (channelId === undefined) {
      return baseInvoke(objectPath, view);
    }

    const datasetId = domainObject.identifier.key.replace(/:red$|:yellow$|:any$/g, '');
    const datasetIdentifier = {
      namespace: datasetId.split(':', 2)[0],
      key: datasetId.split(':', 2)[1]
    };

    return cache.get(datasetIdentifier).then((dataset) => {
      const channelType = types.typeForKey('vista.channel');
      const channelKeyString = 'vista:' + channelType.makeId(dataset.identifier, channelId);

      return openmct.objects.get(channelKeyString).then((channelObject) => {
        const resolvedObjectPath = channelObject
          ? [channelObject, ...objectPath.slice(1)]
          : objectPath;

        return baseInvoke(resolvedObjectPath, view);
      });
    });
  };

  action.patchedForChannelAlarms = true;
}

function ChannelAlarmPlugin(domains, cache) {
  const values = domains.concat([
    {
      name: 'Channel',
      key: 'channel_id',
      type: 'id'
    },
    {
      name: 'DN',
      key: 'dn',
      type: 'dn',
      hints: {
        range: 0
      }
    },
    {
      name: 'EU',
      key: 'eu',
      type: 'eu',
      hints: {
        range: 1
      }
    },
    {
      name: 'DN Alarm State',
      key: 'dn_alarm_state',
      type: 'state'
    },
    {
      name: 'EU Alarm State',
      key: 'eu_alarm_state',
      type: 'state'
    },
    {
      name: 'Realtime',
      key: 'realtime',
      filters: [
        {
          comparator: 'equals',
          possibleValues: [
            { value: true, label: 'Realtime' },
            { value: false, label: 'Recorded' }
          ]
        }
      ]
    }
  ]);

  return function install(openmct) {
    patchViewHistoricalDataForChannelAlarms(openmct, cache);

    openmct.types.addType('vista.channel.alarmNode', {
      cssClass: 'icon-dictionary',
      initialize: function (object) {
        object.telemetry = {};
      }
    });

    openmct.types.addType('vista.channel.alarms', {
      cssClass: 'icon-dictionary'
    });

    openmct.composition.addProvider({
      appliesTo: function (domainObject) {
        return domainObject.type === 'vista.channel.alarms';
      },
      load: function (domainObject) {
        return Promise.resolve([
          {
            namespace: 'vista-channel-alarms',
            key: domainObject.identifier.key + ':red'
          },
          {
            namespace: 'vista-channel-alarms',
            key: domainObject.identifier.key + ':yellow'
          },
          {
            namespace: 'vista-channel-alarms',
            key: domainObject.identifier.key + ':any'
          }
        ]);
      }
    });

    openmct.objects.addProvider('vista-channel-alarms', {
      get: function (identifier) {
        const datasetId = identifier.key.replace(/:red$|:yellow$|:any$/g, '');
        const parentIdentifier = 'vista-channel-alarms:' + datasetId;
        const datasetIdentifier = {
          key: datasetId.split(':', 2)[1],
          namespace: datasetId.split(':', 2)[0]
        };
        return cache.get(datasetIdentifier).then((dataset) => {
          let prefix = '';
          if (dataset.options.prefix) {
            prefix = dataset.options.prefix + ' ';
          }
          if (identifier.key.includes(':red')) {
            return {
              type: 'vista.channel.alarmNode',
              location: parentIdentifier,
              identifier: identifier,
              telemetry: {
                channelHistoricalUrl: dataset.options.channelHistoricalUrl,
                alarmMessageStreamUrl: dataset.options.alarmMessageStreamUrl,
                mcwsVersion: dataset.version,
                alarmLevel: 'red',
                values: values,
                definition: {}
              },
              name: prefix + 'Red Alarms'
            };
          } else if (identifier.key.includes(':yellow')) {
            return {
              type: 'vista.channel.alarmNode',
              location: parentIdentifier,
              identifier: identifier,
              telemetry: {
                channelHistoricalUrl: dataset.options.channelHistoricalUrl,
                alarmMessageStreamUrl: dataset.options.alarmMessageStreamUrl,
                mcwsVersion: dataset.version,
                alarmLevel: 'yellow',
                values: values,
                definition: {}
              },
              name: prefix + 'Yellow Alarms'
            };
          } else if (identifier.key.includes(':any')) {
            return {
              type: 'vista.channel.alarmNode',
              location: parentIdentifier,
              identifier: identifier,
              telemetry: {
                channelHistoricalUrl: dataset.options.channelHistoricalUrl,
                alarmMessageStreamUrl: dataset.options.alarmMessageStreamUrl,
                mcwsVersion: dataset.version,
                alarmLevel: 'any',
                values: values,
                definition: {}
              },
              name: prefix + 'Any Alarms'
            };
          } else {
            return {
              type: 'vista.channel.alarms',
              location: openmct.objects.makeKeyString(datasetIdentifier),
              identifier,
              name: prefix + 'Channel Alarms'
            };
          }
        });
      }
    });

    let wrappedGet = openmct.objectViews.get;
    openmct.objectViews.get = function (domainObject) {
      return wrappedGet
        .apply(this, arguments)
        .filter(
          (viewProvider) =>
            domainObject.type !== 'vista.channel.alarmNode' ||
            (domainObject.type === 'vista.channel.alarmNode' && viewProvider.key === 'table')
        );
    };
  };
}

export default ChannelAlarmPlugin;
