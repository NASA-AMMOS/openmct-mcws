import preventImportIntoDatasetModifier from './preventImportIntoDatasetModifier.js';
import importWithDatasetsModifier from './ImportExportWithDatasets/importWithDatasetsModifier.js';
import warnMultipleDatasetsOnDuplicateModifier from './MultipleDatasets/warnMultipleDatasetsOnDuplicateModifier.js';
import imageExportModifier from './ImageExport/ImageExportModifier.js';

/**
 * DEPENDENCY: These modifiers have a dependency on Open MCT action internals.
 */
function ActionModifiersPlugin() {
  return function install(openmct) {
    openmct.on('start', () => {
      preventImportIntoDatasetModifier(openmct);
      importWithDatasetsModifier(openmct);
      warnMultipleDatasetsOnDuplicateModifier(openmct);
      imageExportModifier(openmct);
    });
  };
}

export default ActionModifiersPlugin;
