import { collectReferencedDatasets } from './DatasetCollection';
import { CONSTANTS } from './constants';

function exportWithDatasetsModifier(openmct) {
    const exportAsJSONAction = openmct.actions._allActions['export.JSON'];

    if (exportAsJSONAction) {
        const originalInvokeFunction = exportAsJSONAction.invoke.bind(exportAsJSONAction);
        let datasets;

        exportAsJSONAction.invoke = async (objectPath) => {
            const domainObject = objectPath[0];

            datasets = await collectReferencedDatasets(openmct, domainObject);
            
            return originalInvokeFunction(objectPath);
        }

        const originalWrapTreeFunction = exportAsJSONAction._wrapTree.bind(exportAsJSONAction);

        exportAsJSONAction._wrapTree = () => {
            const treeWrapper = originalWrapTreeFunction();
            treeWrapper[CONSTANTS.DATASETS_IDENTIFIER] = datasets;

            // clean up exportWithDatasetsModifier scoped variables
            datasets = undefined;

            return treeWrapper;
        };
    }
}

export default exportWithDatasetsModifier;
