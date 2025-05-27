<template>
  <div class="l-preview-window">
    <div class="l-browse-bar">
      <div class="l-browse-bar__start">
        <div class="l-browse-bar__object-name--w">
          <span class="l-browse-bar__object-name"> VC {{ vcid }} Bad Frames </span>
        </div>
      </div>
    </div>
    <div class="l-preview-window__object-view l-preview-window__object-view-no-padding">
      <telemetry-table ref="tableComponent" :marking="markingProp" :enable-legacy-toolbar="true">
      </telemetry-table>
    </div>
  </div>
</template>

<script>
import TelemetryTable from 'openmct.tables.components.Table';

export default {
  components: {
    TelemetryTable
  },
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
      default: () => []
    }
  },
  emits: ['destroy-bad-frames'],
  data() {
    return {
      headers: undefined,
      markingProp: {
        enable: true,
        useAlternateControlBar: false,
        rowName: '',
        rowNamePlural: ''
      }
    };
  },
  watch: {
    badFrames: {
      handler(newVal, oldVal) {
        this.table.addNewRow(newVal[newVal.length - 1]);
      }
    }
  },
  mounted() {
    this.table.clearAndUpdateData(this.badFrames);

    this.telemetryTableVueComponent = this.$refs.tableComponent;
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
  beforeUnmount() {
    this.table.sortBy({});
  },
  methods: {
    hideBadFrames() {
      this.$emit('destroy-bad-frames', undefined);
    }
  }
};
</script>
