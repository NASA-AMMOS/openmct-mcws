import SessionService from 'services/session/SessionService';
import { formatNumberSequence } from 'ommUtils/strings';

function imageExportModifier(openmct) {
  const PNGImageExportAction = openmct.actions._allActions['export-as-png'];
  const JPGImageExportAction = openmct.actions._allActions['export-as-jpg'];
  const imageExportActions = [PNGImageExportAction, JPGImageExportAction].filter(Boolean);
  const sessionService = SessionService();

  imageExportActions.forEach((action) => {
    const invoke = action.invoke;

    action.invoke = (objectPath, view) => {
      let filename = objectPath[0].name;
      const sessionFilter = sessionService.getHistoricalSessionFilter();

      if (sessionFilter) {
        filename = `${filename} - ${historicalFilterString(sessionFilter)}`;
      }

      filename = `${filename} - plot`;

      invoke(objectPath, view, filename);
    };
  });
}

function historicalFilterString(sessionFilter) {
  let filterString = formatNumberSequence(sessionFilter.numbers);

  filterString = filterString.replaceAll('...', '-');
  filterString = filterString.replaceAll(', ', '_');

  return `${sessionFilter.host}_${filterString}`;
}

export default imageExportModifier;
