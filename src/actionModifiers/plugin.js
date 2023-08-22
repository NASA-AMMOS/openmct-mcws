import preventImportIntoDatasetModifier from './preventImportIntoDatasetModifier';
import importWithDatasetsModifier from './ImportExportWithDatasets/importWithDatasetsModifier';
import warnMultipleDatasetsOnDuplicateModifier from './MultipleDatasets/warnMultipleDatasetsOnDuplicateModifier';
import warnMultipleDatasetsOnImportModifier from './MultipleDatasets/warnMultipleDatasetsOnImportModifier';

/**
 * DEPENDENCY: These modifiers have a dependency on Open MCT action internals.
 */
function ActionModifiersPlugin() {
    return function install(openmct) {
        openmct.on('start', () => {
            preventImportIntoDatasetModifier(openmct);
            importWithDatasetsModifier(openmct);
            warnMultipleDatasetsOnDuplicateModifier(openmct);
            warnMultipleDatasetsOnImportModifier(openmct);
        });
    }
}

export default ActionModifiersPlugin;
