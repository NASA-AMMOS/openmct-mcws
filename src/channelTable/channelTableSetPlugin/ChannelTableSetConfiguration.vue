<template>
  <div class="c-inspect-properties">
    <div class="c-inspect-properties__header">Layout</div>
    <ul class="c-inspect-properties__section">
      <li class="c-inspect-properties__row">
        <div class="c-inspect-properties__label" title="Auto-size table">
          <label for="AutoSizeControl">Auto-size</label>
        </div>
        <div class="c-inspect-properties__value">
          <input
            v-if="isEditing"
            id="AutoSizeControl"
            type="checkbox"
            :checked="configuration.autosize !== false"
            @change="toggleAutosize()"
          />
          <span v-if="!isEditing && configuration.autosize !== false">Enabled</span>
        </div>
      </li>
      <li class="c-inspect-properties__row">
        <div class="c-inspect-properties__label" title="Show or hide headers">
          <label for="header-visibility">Hide Header</label>
        </div>
        <div class="c-inspect-properties__value">
          <input
            v-if="isEditing"
            id="header-visibility"
            type="checkbox"
            :checked="configuration.hideHeaders === true"
            @change="toggleHeaderVisibility"
          />
          <span v-if="!isEditing && configuration.hideHeaders === true">True</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  inject: ['tableConfiguration', 'openmct'],
  data() {
    return {
      isEditing: this.openmct.editor.isEditing(),
      configuration: this.tableConfiguration.getConfiguration()
    };
  },
  mounted() {
    this.openmct.editor.on('isEditing', this.toggleEdit);
  },
  unmounted() {
    this.tableConfiguration.destroy();
    this.openmct.editor.off('isEditing', this.toggleEdit);
  },
  methods: {
    toggleAutosize() {
      this.configuration.autosize = !this.configuration.autosize;
      this.tableConfiguration.updateConfiguration(this.configuration);
    },
    toggleHeaderVisibility() {
      this.configuration.hideHeaders = !this.configuration.hideHeaders;
      this.tableConfiguration.updateConfiguration(this.configuration);
    },
    toggleEdit(isEditing) {
      this.isEditing = isEditing;
    }
  }
};
</script>
