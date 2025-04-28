<template>
  <div class="c-inspect-properties">
    <div class="c-inspect-properties__header">Out-of-Alarm Channels</div>
    <ul class="c-inspect-properties__section">
      <li class="c-inspect-properties__row">
        <div class="c-inspect-properties__label" title="Clear channels if no longer in alarm state">
          <label for="autoClearTimeout">Auto-clear (mins)</label>
        </div>
        <div class="c-inspect-properties__value">
          <input
            v-if="isEditing"
            id="autoClearTimeout"
            v-model="autoClearTimeout"
            type="number"
            @input="setAutoClearTimeout"
          />
          <span v-else id="autoClearTimeout">{{ autoClearTimeout }}</span>
        </div>
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
    };
  },
  mounted() {
    this.domainObject = this.openmct.selection.get()[0][0].context.item;
    if (this.domainObject.configuration && this.domainObject.configuration.autoClearTimeout) {
      this.autoClearTimeout = this.domainObject.configuration.autoClearTimeout;
    }
    this.unlisteners = [];
    this.openmct.editor.on('isEditing', this.toggleEdit);
  },
  beforeUnmount() {
    this.openmct.editor.off('isEditing', this.toggleEdit);
    this.unlisteners.forEach((unlisten) => unlisten());
  },
  methods: {
    toggleEdit(isEditing) {
      this.isEditing = isEditing;
    },
    setAutoClearTimeout() {
      this.openmct.objects.mutate(
        this.domainObject,
        'configuration.autoClearTimeout',
        this.autoClearTimeout
      );
    }
  }
};
</script>
