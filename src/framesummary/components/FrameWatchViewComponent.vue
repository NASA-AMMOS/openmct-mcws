<template>
<div class="c-table">
    <div class="c-table-summary">
        <div class="c-table-and-summary__summary-item">FSW Valid Frames: {{ validFrames }}</div>
        <div class="c-table-and-summary__summary-item">FSW Invalid Frames: {{ invalidFrames }}</div>
        <div class="c-table-and-summary__summary-item">FSW Idle Frames: {{ idleFrames }}</div>
    </div>
    <div class="v-frame-watch-table">
         <table-component
            ref="tableComponent"
            :allowSorting="true"
            :isEditing="isEditing"
            :marking="markingProp"
            :view="view"
        />
    </div>
</div>
</template>

<style
    lang="scss"
    scoped
>
.c-table {
    display: flex;
    flex-direction: column;
    
    .c-table-summary {
        display: flex;
        flex-direction: row;
        align-items: stretch;
        min-height: 2em;
    }

    .v-frame-watch-table {
        min-height: calc(100% - 2em);
    }
}
</style>

<script>
import TableComponent from 'openmct.tables.components.Table';

export default {
    inject: [
        'openmct',
        'table',
        'objectPath'
    ],
    components: {
        TableComponent
    },
    props: {
        isEditing: {
            type: Boolean,
            required: true
        },
        view: {
            type: Object,
            required: true
        }
    },
    mounted() {
        this.table.on('update-header', this.updateHeader);
    },
    destroyed() {
        this.table.off('update-header', this.updateHeader);
    },
    data() {
        let markingProp = {
            enable: true,
            useAlternateControlBar: false,
            rowName: '',
            rowNamePlural: ''
        };

        return {
            markingProp,
            validFrames: '--',
            invalidFrames: '--',
            idleFrames: '--'
        }
    },
    methods: {
        getViewContext() {
            let tableComponent = this.$refs.tableComponent;

            if (tableComponent) {
                return tableComponent.getViewContext();
            }
        },
        updateHeader() {
            this.validFrames = this.table.validFrames;
            this.invalidFrames = this.table.invalidFrames;
            this.idleFrames = this.table.idleFrames;
        }
    }
}
</script>
