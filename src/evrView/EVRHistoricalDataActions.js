import types from '../types/types.js';

const VIEW_HISTORICAL_DATA_ACTION_KEY = 'viewHistoricalData';

const EVR_TELEMETRY_TYPES = ['vista.evr', 'vista.evrModule', 'vista.evrSource'];

function getRowDatum(view) {
  const viewContext = (view && view.getViewContext && view.getViewContext()) || {};

  return viewContext.row && viewContext.row.getDatum && viewContext.row.getDatum();
}

// Only offer these actions for an actual EVR row right-click: objectPath[0] must be
// resolved to one of the EVR telemetry types (this is what the row's default
// getContextualDomainObject already resolves to; see EVRHistoricalContextTableRow),
// and there must be a clicked-row context to resolve level/module/name from. Without
// this, ActionsAPI treats a missing appliesTo as "always applies" and these would leak
// into unrelated context menus (e.g. right-clicking the dataset itself).
function appliesTo(objectPath, view) {
  const domainObject = objectPath && objectPath[0];

  if (!domainObject || !EVR_TELEMETRY_TYPES.includes(domainObject.type)) {
    return false;
  }

  return Boolean(getRowDatum(view));
}

function getDatasetIdentifier(domainObject) {
  try {
    const identifier = domainObject.identifier;
    const matchingType = types.typeForIdentifier(identifier);

    return matchingType.data(identifier).datasetIdentifier;
  } catch (e) {
    return null;
  }
}

function makeInvoke(openmct, resolveTargetIdentifier) {
  return function invoke(objectPath, view) {
    const baseAction = openmct.actions.getAction(VIEW_HISTORICAL_DATA_ACTION_KEY);
    const domainObject = objectPath && objectPath[0];
    const datum = getRowDatum(view);
    const datasetIdentifier = domainObject && getDatasetIdentifier(domainObject);
    const targetIdentifier =
      datum && datasetIdentifier && resolveTargetIdentifier(datum, datasetIdentifier);

    if (!targetIdentifier) {
      return baseAction.invoke(objectPath, view);
    }

    const keyString = openmct.objects.makeKeyString(targetIdentifier);

    return openmct.objects.get(keyString).then((targetObject) => {
      const resolvedObjectPath = targetObject
        ? [targetObject, ...objectPath.slice(1)]
        : objectPath;

      return baseAction.invoke(resolvedObjectPath, view);
    });
  };
}

export default function EVRHistoricalDataActions(openmct) {
  const actions = [
    {
      name: 'View Historical Level',
      key: 'vista.evr.view-historical-level',
      description: "View Historical Data for this row's Level",
      cssClass: 'icon-eye-open',
      invoke: makeInvoke(
        openmct,
        (datum, datasetIdentifier) =>
          datum.level &&
          types.EVRModule.makeIdentifier(datum.level.toUpperCase(), datasetIdentifier)
      )
    },
    {
      name: 'View Historical Module',
      key: 'vista.evr.view-historical-module',
      description: "View Historical Data for this row's Module",
      cssClass: 'icon-eye-open',
      invoke: makeInvoke(
        openmct,
        (datum, datasetIdentifier) =>
          datum.module &&
          types.EVRModule.makeIdentifier(datum.module.toUpperCase(), datasetIdentifier)
      )
    },
    {
      name: 'View Historical EVR',
      key: 'vista.evr.view-historical-evr',
      description: "View Historical Data for this row's EVR",
      cssClass: 'icon-eye-open',
      invoke: makeInvoke(
        openmct,
        (datum, datasetIdentifier) =>
          datum.name && types.EVR.makeIdentifier(datasetIdentifier, datum.name.toUpperCase())
      )
    }
  ];

  actions.forEach((action) => {
    action.appliesTo = appliesTo;
  });

  return actions;
}
