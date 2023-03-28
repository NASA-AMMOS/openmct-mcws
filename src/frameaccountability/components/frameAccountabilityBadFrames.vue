<template>
<div
    class="l-preview-window"
>
    <div class="l-browse-bar">
        <div class="l-browse-bar__start">
            <div class="l-browse-bar__object-name--w">
                <span class="l-browse-bar__object-name">
                    VC {{vcid}} Bad Frames
                </span>
            </div>
        </div>
    </div>
    <div class="l-preview-window__object-view l-preview-window__object-view-no-padding">
        <telemetry-table
            :marking="markingProp"
            :enableLegacyToolbar="true"
        >
        </telemetry-table>
    </div>
</div>
</template>

<script>
import TelemetryTable from 'openmct.tables.components.Table';

export default {
    inject: ['openmct', 'table', 'objectPath'],
    props: {
        vcid: {
            type: String,
            default: undefined
        },
        values: {
            type: Array,
            default: undefined
        },
        badFrames: {
            type: Array,
            default: []
        }
    },
    components: {
        TelemetryTable
    },
    data() {
        return {
            headers: undefined,
            markingProp: {
                enable: true,
                useAlternateControlBar: false,
                rowName: "",
                rowNamePlural: ""
            }
        }
    },
    watch: {
        badFrames: {
            handler(newVal, oldVal) {
                this.table.addNewRow(newVal[newVal.length - 1]);
            }
        }
    },
    methods: {
        hideBadFrames() {
            this.$emit('destroy:badframes', undefined);
        }
    },
    mounted() {
        this.table.clearAndUpdateData(this.badFrames);

        this.telemetryTableVueComponent = this.$children[0];
        this.telemetryTableVueComponent.sortBy('event_time');

        let overlay = this.openmct.overlays.overlay({
            element: this.$el,
            size: 'large',
            buttons: [
                {
                    label: 'Done',
                    callback: () => overlay.dismiss()
                }
            ],
            onDestroy: this.hideBadFrames
        });
    },
    destroyed() {
       this.table.sortBy({});
    }
}
</script>
