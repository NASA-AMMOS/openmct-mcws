import DatasetCache from 'services/dataset/DatasetCache';

export default function warnMultipleDatasetsOnDuplicateModifier(openmct) {
  const duplicateAction = openmct.actions._allActions['duplicate'];

  if (duplicateAction) {
    const originalOnSaveFunction = duplicateAction.onSave.bind(duplicateAction);

    duplicateAction.onSave = async (object, parent, changes) => {
      const datasetCache = DatasetCache();
      const datasets = await datasetCache.getDomainObjects();

      const isDuplicatingDataset = datasets.some(dataset => openmct.objects.areIdsEqual(
        dataset.identifier, object.identifier)
      );

      const confirmDuplicateDataset = () => {
        const dialog = openmct.overlays.dialog({
          iconClass: 'alert',
          message: `Datasets should provide unique data.
            A valid usecase for adding an additional dataset would be splitting all data into separate pre-indexed data.
          `,
          buttons: [
            {
              label: 'OK',
              callback: () => {
                dialog.dismiss();
                originalOnSaveFunction(object, parent, changes);
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
        originalOnSaveFunction(object, parent, changes);
      }
    };
  }
};
