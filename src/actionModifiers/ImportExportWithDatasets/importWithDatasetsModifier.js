import ImportWithDatasetsFormComponent from './ImportWithDatasetsFormComponent.vue';
import mount from 'utils/mountVueComponent';
import DatasetCache from 'services/dataset/DatasetCache';
import Types from 'types/types';

function importWithDatasetsModifier(openmct) {
    openmct.forms.addNewFormControl('import-with-datasets-controller', getImportWithDatasetsFormController(openmct));

    let datasets;
    let referencedDatasets;
    let component;
    let _destroy = null;

    const importAsJSONAction = openmct.actions._allActions['import.JSON'];

    if (importAsJSONAction) {
        const originalOnSaveFunction = importAsJSONAction.onSave.bind(importAsJSONAction);

        importAsJSONAction.onSave = (object, changes) => {
            let changesWithDatasetMapping = changes;
            let stringifiedObjectTree = changesWithDatasetMapping.selectFile.body;
            const datasetMapping = changesWithDatasetMapping.mapping;

            Object.entries(datasetMapping).forEach(([referencedDataset, dataset]) => {
                let regex = new RegExp(referencedDataset, 'g');
                stringifiedObjectTree = stringifiedObjectTree.replace(regex, dataset);
            });

            changesWithDatasetMapping.selectFile.body = stringifiedObjectTree;

            return originalOnSaveFunction(object, changesWithDatasetMapping);
        };

        importAsJSONAction._showForm = showFormWithDatasetMapping.bind(importAsJSONAction);
    }

    function showFormWithDatasetMapping(domainObject) {
        const formStructure = {
            title: this.name,
            sections: [
                {
                    rows: [
                        {
                            name: 'Select File',
                            key: 'selectFile',
                            control: 'file-input',
                            required: true,
                            text: 'Select File...',
                            validate: validateJSONAndMapDatasets,
                            type: 'application/json'
                        }
                    ]
                },
                {
                    rows: [
                        {
                            name: 'Dataset Mapping',
                            key: 'mapping',
                            control: 'import-with-datasets-controller',
                            hideFromInspector: true,
                            required: true,
                            property: ['mapping'],
                            text: 'Dataset Mapping',
                            validate: (data, callback) => {
                                return callback();
                            }
                        }
                    ]
                }
            ]
        };

        openmct.forms.showForm(formStructure)
            .then(changes => {
                let onSave = this.onSave.bind(this);
                onSave(domainObject, changes);
            })
            .catch(error => {
                _destroy?.();
            });
    }

    /**
     * @private
     * @param {object} data
     * @returns {boolean}
     */
    async function validateJSONAndMapDatasets(data) {
        const value = data.value;
        const objectTree = value && value.body;
        let json;
        let success = true;

        try {
            json = JSON.parse(objectTree);
        } catch(error) {
            success = false;
        }

        if (success && (!json.openmct || !json.rootId)) {
            success = false;
        }

        if (success) {
            const datasetCache = DatasetCache();

            datasets = await datasetCache.getDomainObjects();

            try {
                referencedDatasets = getReferencedDatasetsFromImport(json);

                component.updateData(referencedDatasets, datasets);
            } catch(error) {
                success = false;
            }
        }

        if (!success) {
            openmct.notifications.error('Invalid File: The selected file was either invalid JSON or was not formatted properly for import into Open MCT.');
        }

        return success;
    }

    function getImportWithDatasetsFormController(openmct) {
        return {
            show(element, model, onChange) {
                const componentDefinition = {
                    components: {
                        ImportWithDatasetsFormComponent
                    },
                    provide: {
                        openmct
                    },
                    data() {
                        return {
                            model,
                            onChange,
                            datasets,
                            referencedDatasets,
                            hasImport: false
                        };
                    },
                    template: `<ImportWithDatasetsFormComponent ref="importComponent" :model="model" :datasets="datasets" :referenced-datasets="referencedDatasets" :has-import="hasImport" @onChange="onChange" />`,
                    methods: {
                        updateData(updatedReferencedDatasets, updatedDatasets) {
                            this.datasets = updatedDatasets;
                            this.referencedDatasets = updatedReferencedDatasets;
                            this.hasImport = true
                        }
                    }
                };
                const componentOptions = { element };

                const {
                  componentInstance,
                  destroy,
                  el
                } = mount(componentDefinition, componentOptions);

                component = componentInstance;

                _destroy = destroy;
            },
            destroy() {
                _destroy?.();
                resetAction();
            }
        };
    }

    function resetAction() {
        datasets = undefined;
        referencedDatasets = undefined;
        component = undefined;
        _destroy = undefined;
    }

    function getReferencedDatasetsFromImport(json) {
        const objects = json.openmct;
        const referencedDatasetsFromImport = [];

        Object.values(objects)
            .forEach(object => object.composition
                ?.forEach( identifier => {
                    if (Types.hasTypeForIdentifier(identifier)) {
                        const matchingType = Types.typeForIdentifier(identifier);
                        const data = matchingType.data(identifier);
                        const datasetIdentifier = data.datasetIdentifier;
                        const isAdded = referencedDatasetsFromImport
                            .some(dataset => openmct.objects.areIdsEqual(dataset.identifier, datasetIdentifier));

                        if (!isAdded) {
                            referencedDatasetsFromImport.push({ identifier: datasetIdentifier });
                        }
                    }
                }));

        return referencedDatasetsFromImport;
    }
}

export default importWithDatasetsModifier;
