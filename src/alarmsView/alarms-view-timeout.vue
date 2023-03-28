<template>
    <div class="c-properties" v-if="isEditing">
        <div class="c-properties__header">Out-of-Alarm Channels</div>
        <ul class="c-properties__section">
            <li class="c-properties__row">
                <div class="c-properties__label" title="Clear channels if no longer in alarm state"><label><span style="white-space: nowrap">Auto-clear</span> (minutes)</label></div>
                <div class="c-properties__value"><input type="number" v-model="autoClearTimeout" @input="setAutoClearTimeout"></div>            
            </li>
        </ul>
    </div>
</template>
<script>
export default {
    inject: ['openmct'],
    data() {
        return {
            headers: {},
            isEditing: this.openmct.editor.isEditing(),
            autoClearTimeout: undefined
        }
    },
    methods: {
        toggleEdit(isEditing) {
            this.isEditing = isEditing;
        },
        setAutoClearTimeout() {
            this.openmct.objects.mutate(this.domainObject, 'configuration.autoClearTimeout', this.autoClearTimeout);
        }
    },
    mounted() {
        this.domainObject = this.openmct.selection.get()[0][0].context.item;
        if (this.domainObject.configuration && this.domainObject.configuration.autoClearTimeout) {
            this.autoClearTimeout = this.domainObject.configuration.autoClearTimeout
        }
        this.unlisteners = [];
        this.openmct.editor.on('isEditing', this.toggleEdit);
    },
    destroyed() {
        this.openmct.editor.off('isEditing', this.toggleEdit);
        this.unlisteners.forEach((unlisten) => unlisten());
    }
}
</script>
