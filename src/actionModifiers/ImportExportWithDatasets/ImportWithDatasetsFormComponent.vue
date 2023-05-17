<template>
<span class="form-control">
    <span
        class="field control"
        :class="model.cssClass"
        v-if="hasImport"
    >
        <div
            v-if="!hasReferencedDatasets"
        >
            {{ noDatasetMappingRequiredText }}
        </div>
        <div
            v-else-if="hasOneToOneMapping"
        >
            {{ noDatasetMappingRequiredText }}
        </div>
        <div
            v-else-if="hasReferencedDatasets && !hasDatasets"
        >
            {{ noDatasetsText }}
        </div>
        <template
            v-else
        >
            <div>
                {{ mappingInstructionsText }}
            </div>
            <div
                class="c-form--sub-grid"
            >
                <div
                    v-for="referencedDataset in referencedDatasets"
                    :key="makeKeyString(referencedDataset)"
                    class="c-form__row"
                >
                    <span class="req-indicator req"></span>
                    <label>{{ getDatasetName(referencedDataset) }}</label>
                    <select
                        v-model="mapping[makeKeyString(referencedDataset)]"
                        @change="onChange"
                        class="field control select-field"
                    >
                        <option
                            v-for="option in datasetOptions"
                            :key="option.value"
                            :value="option.value"
                            :selected="option.value === mapping[makeKeyString(referencedDataset)]"
                        >
                            {{ option.name }}
                        </option>
                    </select>
                </div>
            </div>
        </template>
    </span>
</span>
</template>

<script>
export default {
    inject: ['openmct'],
    props: {
        model: {
            type: Object,
            required: true
        },
        datasets: {
            type: Array,
            default: undefined
        },
        referencedDatasets: {
            type: Array,
            default: undefined
        },
        hasImport: {
            type: Boolean,
            required: true
        }
    },
    computed: {
        noDatasetMappingRequiredText() {
            return 'All set. The import does not need dataset mapping.';
        },
        noDatasetsText() {
            return 'The import contains references to datasets that need to be mapped to an existing dataset. Create a dataset before importing.';
        },
        mappingInstructionsText() {
            return 'For each referenced dataset on the left, select an existing dataset on the right.';
        },
        hasReferencedDatasets() {
            return this.referencedDatasets?.length > 0;
        },
        hasDatasets() {
            return this.datasets?.length > 0;
        },
        datasetOptions() {
            return this.datasets.map(dataset => {
                const keyString = this.makeKeyString(dataset);
                const name = this.getDatasetName(dataset);

                return {
                    name: name,
                    value: keyString
                };
            });
        },
        hasOneToOneMapping() {
            return this.datasets?.length === 1
                && this.referencedDatasets?.length === 1;
        },
    },
    data() {
        return {
            mapping: {}
        };
    },
    watch: {
        hasImport() {
            this.onHasImport();
        }
    },
    mounted() {
        this.data = {
            model: {
                key: this.model.key,
                property: this.model.property
            },
            value: this.mapping
        }
    },
    methods: {
        onHasImport() {
            this.buildMapping();
            this.onChange();
        },
        buildMapping() {
            this.referencedDatasets?.forEach(referencedDataset => {
                const referencedDatasetKeyString = this.makeKeyString(referencedDataset);
                const datasetKeyString = this.makeKeyString(this.datasets[0]);

                this.$set(this.mapping, referencedDatasetKeyString, datasetKeyString);
            });
        },
        makeKeyString(domainObject) {
            return this.openmct.objects.makeKeyString(domainObject.identifier);
        },
        getDatasetName(dataset) {
            const keyString = this.makeKeyString(dataset);
            const name = dataset.name || keyString;

            return name;
        },
        onChange(event) {
            this.validate();

            this.$emit('onChange', this.data);
        },
        validate() {
            this.model.validate(this.data, () => {
                if (this.hasReferencedDatasets) {
                    return this.hasDatasets;
                }

                return true;
            });
        }
    }
};
</script>
