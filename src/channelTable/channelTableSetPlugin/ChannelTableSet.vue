<template>
    <table class="c-table c-lad-table">
        <thead>
            <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Value</th>
                <th>{{ timesystem }}</th>
            </tr>
        </thead>
        <tbody>
            <template
                v-for="ladTable in ladTableObjects"
            >
                <tr
                    :key="ladTable.key"
                    class="c-table__group-header js-lad-table-set__table-headers"
                >
                    <td colspan="10">
                        {{ ladTable.domainObject.name }}
                    </td>
                </tr>
                <channel-row
                    v-for="ladRow in ladTelemetryObjects[ladTable.key]"
                    :key="ladRow.key"
                    :domain-object="ladRow.domainObject"
                    :path-to-table="ladTable.objectPath"
                    @rowContextClick="updateViewContext"
                />
            </template>
        </tbody>
    </table>
</template>

<script>
import ChannelRow from './ChannelRow.vue';
export default {
    components: {
        ChannelRow
    },
    inject: ['openmct', 'objectPath', 'currentView'],
    props: {
        domainObject: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            ladTableObjects: [],
            ladTelemetryObjects: {},
            compositions: [],
            viewContext: {},
            timesystem: '---'
        };
    },
    mounted() {
        this.composition = this.openmct.composition.get(this.domainObject);
        this.composition.on('add', this.addLadTable);
        this.composition.on('remove', this.removeLadTable);
        this.composition.on('reorder', this.reorderLadTables);
        this.openmct.time.on('timeSystem', this.setTimesystem);
        this.setTimesystem(this.openmct.time.timeSystem());
        this.composition.load();
    },
    destroyed() {
        this.composition.off('add', this.addLadTable);
        this.composition.off('remove', this.removeLadTable);
        this.composition.off('reorder', this.reorderLadTables);
        this.compositions.forEach(c => {
            c.composition.off('add', c.addCallback);
            c.composition.off('remove', c.removeCallback);
        });
        this.openmct.time.off('timeSystem', this.setTimesystem);
    },
    methods: {
        addLadTable(domainObject) {
            let ladTable = {};
            ladTable.domainObject = domainObject;
            ladTable.key = this.openmct.objects.makeKeyString(domainObject.identifier);
            ladTable.objectPath = [domainObject, ...this.objectPath];
            this.$set(this.ladTelemetryObjects, ladTable.key, []);
            this.ladTableObjects.push(ladTable);
            let composition = this.openmct.composition.get(ladTable.domainObject);
            let addCallback = this.addTelemetryObject(ladTable);
            let removeCallback = this.removeTelemetryObject(ladTable);
            composition.on('add', addCallback);
            composition.on('remove', removeCallback);
            composition.load();
            this.compositions.push({
                composition,
                addCallback,
                removeCallback
            });
        },
        removeLadTable(identifier) {
            let index = this.ladTableObjects.findIndex(ladTable => this.openmct.objects.makeKeyString(identifier) === ladTable.key);
            let ladTable = this.ladTableObjects[index];
            this.$delete(this.ladTelemetryObjects, ladTable.key);
            this.ladTableObjects.splice(index, 1);
        },
        reorderLadTables(reorderPlan) {
            let oldComposition = this.ladTableObjects.slice();
            reorderPlan.forEach(reorderEvent => {
                this.$set(this.ladTableObjects, reorderEvent.newIndex, oldComposition[reorderEvent.oldIndex]);
            });
        },
        setTimesystem(timesystem) {
            this.timesystem = timesystem.name;
        },
        addTelemetryObject(ladTable) {
            return (domainObject) => {
                let telemetryObject = {};
                telemetryObject.key = this.openmct.objects.makeKeyString(domainObject.identifier);
                telemetryObject.domainObject = domainObject;
                let telemetryObjects = this.ladTelemetryObjects[ladTable.key];
                telemetryObjects.push(telemetryObject);
                this.$set(this.ladTelemetryObjects, ladTable.key, telemetryObjects);
            };
        },
        removeTelemetryObject(ladTable) {
            return (identifier) => {
                let telemetryObjects = this.ladTelemetryObjects[ladTable.key];
                let index = telemetryObjects.findIndex(telemetryObject => this.openmct.objects.makeKeyString(identifier) === telemetryObject.key);
                telemetryObjects.splice(index, 1);
                this.$set(this.ladTelemetryObjects, ladTable.key, telemetryObjects);
            };
        },
        updateViewContext(rowContext) {
            this.viewContext.row = rowContext;
        },
        getViewContext() {
            return this.viewContext;
        }
    }
};
</script>
