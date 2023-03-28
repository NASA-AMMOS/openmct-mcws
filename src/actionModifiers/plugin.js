import preventImportIntoDatasetModifier from './preventImportIntoDatasetModifier';
import exportWithDatasetsModifier from './ImportExportWithDatasets/exportWithDatasetsModifier';
import importWithDatasetsModifier from './ImportExportWithDatasets/importWithDatasetsModifier';

function plugin() {
    return function install(openmct) {

        openmct.on('start', () => {
            preventImportIntoDatasetModifier(openmct);
            exportWithDatasetsModifier(openmct);
            importWithDatasetsModifier(openmct);
        });
    }
}

export default plugin;
