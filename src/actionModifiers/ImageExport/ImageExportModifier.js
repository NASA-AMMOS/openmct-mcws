import SessionService from 'services/session/SessionService';

function imageExportModifier(openmct) {
  const PNGImageExportAction = openmct.actions._allActions['export-as-png'];
  const JPGImageExportAction = openmct.actions._allActions['export-as-jpg'];
  const imageExportActions = [PNGImageExportAction, JPGImageExportAction].filter(Boolean);

  imageExportActions.forEach((action) => {
    action.appliesTo = (objectPath, view = {}) => {
      return isPlotView(view);
    };
  });
}

export default imageExportModifier;
