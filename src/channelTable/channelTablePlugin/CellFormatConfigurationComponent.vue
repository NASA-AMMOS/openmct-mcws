<template>
<div class="c-properties" v-if="isEditing">
  <div class="c-properties__header">Cell Format</div>
  <ul class="c-properties__section">
    <li class="c-properties__row">
      <div class="c-properties__label" title="Printf formatting for the selected cell"><label for="cellPrintfFormat">Format</label></div>
      <div class="c-properties__value"><input id="cellPrintfFormat" type="text" @change="formatCell" :value="cellFormat"></div>
    </li>
  </ul>
</div>
</template>

<script>
export default {
  inject: ['tableConfiguration', 'openmct'],
  data() {
    let configuration = this.tableConfiguration.getConfiguration();
    let selection = this.openmct.selection.get()[0][0];

    configuration.cellFormat = configuration.cellFormat || {};
    let rowFormat = configuration.cellFormat[selection.context.row] || {};

    return {
      isEditing: this.openmct.editor.isEditing(),
      cellFormat: rowFormat[selection.context.column]
    }
  },
  methods: {
    toggleEdit(isEditing) {
      this.isEditing = isEditing;
    },
    formatCell(event) {
      let selection = this.openmct.selection.get()[0][0];
      let configuration = this.tableConfiguration.getConfiguration();

      configuration.cellFormat = configuration.cellFormat || {};
      configuration.cellFormat[selection.context.row] = configuration.cellFormat[selection.context.row] || {};
      configuration.cellFormat[selection.context.row][selection.context.column] = event.currentTarget.value;
      this.tableConfiguration.updateConfiguration(configuration);
    }
  },
  mounted() {
    this.openmct.editor.on('isEditing', this.toggleEdit);
  },
  beforeUnmount() {
    this.tableConfiguration.destroy();
    this.openmct.editor.off('isEditing', this.toggleEdit);
  }
}
</script>
