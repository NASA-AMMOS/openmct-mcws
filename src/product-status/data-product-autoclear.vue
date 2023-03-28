<template>
    <div class="c-properties" v-if="isEditing">
        <div class="c-properties__header">Auto-clear Completed Products</div>
        <ul class="c-properties__section">
            <li class="c-properties__row">
                <div class="c-properties__label" title="Automatically remove completed data products after a number of minutes. If left blank, completed products will not be removed from the view.">
                    <label>Clear after minutes</label>
                </div>
                <div class="c-properties__value"><input class="c-input--sm c-input-number--no-spinners" type="number" ref="autoClearTimeout" v-model="autoClearTimeout" @change="setAutoClearTimeout"></div>
            </li>
        </ul>
    </div>
</template>
<script>
import _ from 'lodash';

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
            this.openmct.objects.mutate(this.domainObject, 'configuration.autoClearTimeout', this.$refs.autoClearTimeout.value);
        }
    },
    mounted() {
        this.domainObject = this.openmct.selection.get()[0][0].context.item;
        this.autoClearTimeout = _.get(this.domainObject, 'configuration.autoClearTimeout');
        this.unlisteners = [];
        this.openmct.editor.on('isEditing', this.toggleEdit);
    },
    destroyed() {
        this.openmct.editor.off('isEditing', this.toggleEdit);
        this.unlisteners.forEach((unlisten) => unlisten());
    }
}
</script>
