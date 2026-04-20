import SessionService from 'services/session/SessionService.js';
import { formatNumberSequence } from 'ommUtils/strings.js';

function imageExportModifier(openmct) {
  const PNGImageExportAction = openmct.actions._allActions['export-as-png'];
  const JPGImageExportAction = openmct.actions._allActions['export-as-jpg'];
  const imageExportActions = [PNGImageExportAction, JPGImageExportAction];
  const sessionService = SessionService();

  imageExportActions.forEach((action) => {
    const invoke = action.invoke;

    action.invoke = (objectPath, view) => {
      const domainObject = objectPath[0];
      let filename = domainObject.name;
      const type = domainObject.type;
      const sessionFilter = sessionService.getHistoricalSessionFilter();

      if (sessionFilter) {
        filename = `${filename} - ${historicalFilterString(sessionFilter)}`;
      }

      filename = `${filename} - ${type}`;

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
