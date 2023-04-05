import preventImportIntoDatasetModifier from './preventImportIntoDatasetModifier';
import importWithDatasetsModifier from './ImportExportWithDatasets/importWithDatasetsModifier';

function ImportExportWithDatasetsPlugin() {
    return function install(openmct) {
        openmct.on('start', () => {
            preventImportIntoDatasetModifier(openmct);
            importWithDatasetsModifier(openmct);
        });
    }
}

export default ImportExportWithDatasetsPlugin;
