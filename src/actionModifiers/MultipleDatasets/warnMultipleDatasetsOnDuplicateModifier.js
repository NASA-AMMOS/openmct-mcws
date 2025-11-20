import { MULTIPLE_DATASET_WARNING } from './constants.js';

export default function warnMultipleDatasetsOnDuplicateModifier(openmct) {
  const duplicateAction = openmct.actions._allActions['duplicate'];
  let object;

  if (duplicateAction) {
    const originalOnSaveFunction = duplicateAction.onSave.bind(duplicateAction);
    const originalInvokeFunction = duplicateAction.invoke.bind(duplicateAction);

    duplicateAction.invoke = (objectPath) => {
      object = objectPath[0];

      originalInvokeFunction(objectPath);
    };

    duplicateAction.onSave = async (changes) => {
      const isDuplicatingDataset = object.type === 'vista.dataset';

      const confirmDuplicateDataset = () => {
        const dialog = openmct.overlays.dialog({
          iconClass: 'alert',
          message: MULTIPLE_DATASET_WARNING,
          buttons: [
            {
              label: 'OK',
              callback: () => {
                dialog.dismiss();
                originalOnSaveFunction(changes);
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

      if (isDuplicatingDataset) {
        confirmDuplicateDataset();
      } else {
        originalOnSaveFunction(changes);
      }
    };
  }
}
