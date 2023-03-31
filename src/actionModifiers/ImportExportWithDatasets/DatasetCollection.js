import { dynamicPromiseAll } from "../../utils/promises";

class DatasetCollection {
    #datasets;
    #visited;
    #domainObject;
    #openmct;
    #visitedPromises;

    constructor(openmct, domainObject) {
        this.#datasets = new Set();
        this.#visited = new Set();
        this.#visitedPromises = [];

        this.#openmct = openmct;
        this.#domainObject = domainObject;
    }

    async getReferencedDatasets() {
        this.#collectDatasetsFromTree(this.#domainObject);

        await dynamicPromiseAll(this.#visitedPromises);

        const datasetsPromises = Array.from(this.#datasets)
            .map(datasetKeyString => {
                return this.#openmct.objects.get(datasetKeyString)
                    .then(object => {
                        return {
                            identifier: object.identifier,
                            name: object.name
                        }
                    });
            });

        const datasets = await Promise.all(datasetsPromises);

        return datasets;
    }

    async #collectDatasetsFromTree(node) {
        let visited;
        const visitedPromise = new Promise((resolve, reject) => {
            visited = resolve;
        });
        this.#visitedPromises.push(visitedPromise);
        
        if (this.#hasVisited(node)) {
            visited();
            return;
        }

        this.#visited.add(
            this.#getId(node)
        );

        if (this.#referencesDataset(node)) {
            const datasetId = this.#getReferencedDatasetId(node);

            this.#datasets.add(datasetId);
        } else {
            const compositionCollection = this.#openmct.composition.get(node);

            if (compositionCollection !== undefined) {
                const composition = await compositionCollection.load();
                composition.forEach(this.#collectDatasetsFromTree.bind(this));
            }
        }

        visited();
    }

    #hasVisited(node) {
        const id = this.#openmct.objects.makeKeyString(node.identifier);

        return this.#visited[id];
    }

    #referencesDataset(domainObject) {
        return domainObject.identifier.namespace === 'vista';
    }

    #getReferencedDatasetId(domainObject) {
        const location = domainObject.location;
        const locationParts = location.split(':');
        const datasetNamespace = locationParts[locationParts.length - 2];
        const datasetKey = locationParts[locationParts.length - 1];

        const datasetKeyString = `${datasetNamespace}:${datasetKey}`;

        return datasetKeyString;
    }

    #getId(domainObject) {
        return this.#openmct.objects.makeKeyString(domainObject.identifier);
    }
}

async function collectReferencedDatasets(openmct, domainObject) {
    const datasetCollection = new DatasetCollection(openmct, domainObject);
    const datasets = await datasetCollection.getReferencedDatasets();

    return datasets;
}

export {
    collectReferencedDatasets
};
