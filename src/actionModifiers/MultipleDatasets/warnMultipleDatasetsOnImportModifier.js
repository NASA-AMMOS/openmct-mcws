import DatasetCache from 'services/dataset/DatasetCache.js';
import { MULTIPLE_DATASET_WARNING } from './constants.js';

export default function warnMultipleDatasetsOnImportModifier(openmct) {
  const importAsJSONAction = openmct.actions._allActions['import.JSON'];

  if (importAsJSONAction) {
    const originalOnSaveFunction = importAsJSONAction.onSave.bind(importAsJSONAction);

    importAsJSONAction.onSave = async (object, changes) => {
      const datasetCache = DatasetCache();
      const datasets = await datasetCache.getDomainObjects();
      const selectFile = changes.selectFile;
      const stringifiedObjectTree = selectFile.body;
      const isImportingDataset = stringifiedObjectTree.includes('vista.dataset');

      const confirmMultipleDatasets = () => {
        const dialog = openmct.overlays.dialog({
          iconClass: 'alert',
          message: MULTIPLE_DATASET_WARNING,
          buttons: [
            {
              label: 'OK',
              callback: () => {
                dialog.dismiss();
                originalOnSaveFunction(object, changes);
              }
            },
            {
              label: 'Cancel',
              callback: () => {
                dialog.dismiss();
              }
            }
          ]
        });
      };

      if (datasets.length && isImportingDataset) {
        confirmMultipleDatasets();
      } else {
        originalOnSaveFunction(object, changes);
      }
    };
  }
}
