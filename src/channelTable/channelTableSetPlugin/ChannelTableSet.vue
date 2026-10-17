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
      <template v-for="ladTable in ladTableObjects" :key="ladTable.key">
        <tr class="c-table__group-header js-lad-table-set__table-headers">
          <td colspan="10">
            {{ ladTable.domainObject.name }}
          </td>
        </tr>
        <channel-row
          v-for="ladRow in ladTelemetryObjects[ladTable.key]"
          :ref="(el) => setRowRef(ladRow.key, el)"
          :key="ladRow.key"
          :domain-object="ladRow.domainObject"
          :path-to-table="ladTable.objectPath"
          :paused="paused"
          :marked="isMarked(ladRow.key)"
          @mark="markRow"
          @unmark="unmarkRow"
          @row-context-click="updateViewContext"
        />
      </template>
    </tbody>
  </table>
</template>

<script>
import ChannelRow from './ChannelRow.vue';
import CSVExporter, { sanitizeCsvFormulaInjection } from '@/exporters/CSVExporter.js';
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
      viewContext: {},
      timesystem: '---',
      paused: false,
      markedRows: []
    };
  },
  watch: {
    paused() {
      this.updatePausePlayActions();
    },
    markedRows() {
      this.updateMarkedActions();
    }
  },
  mounted() {
    // Non-reactive on purpose: CompositionCollections use private fields,
    // which throw when accessed through Vue's reactive proxies.
    this.compositions = [];
    this.rowRefs = {};
    this.csvExporter = new CSVExporter();
    this.composition = this.openmct.composition.get(this.domainObject);
    this.composition.on('add', this.addLadTable);
    this.composition.on('remove', this.removeLadTable);
    this.composition.on('reorder', this.reorderLadTables);
    this.openmct.time.on('timeSystemChanged', this.setTimeSystem);
    this.setTimeSystem(this.openmct.time.getTimeSystem());
    this.composition.load();
    this.$nextTick(() => {
      this.viewActionsCollection = this.openmct.actions.getActionsCollection(
        this.objectPath,
        this.currentView
      );
      this.initializeViewActions();
    });
  },
  beforeUnmount() {
    // Teardown must be idempotent: a second pass would remove listeners
    // that no longer exist, and any throw here aborts the whole unmount.
    if (this.hasTornDown) {
      return;
    }

    this.hasTornDown = true;
    this.composition.off('add', this.addLadTable);
    this.composition.off('remove', this.removeLadTable);
    this.composition.off('reorder', this.reorderLadTables);
    this.compositions.forEach((c) => {
      c.composition.off('add', c.addCallback);
      c.composition.off('remove', c.removeCallback);
    });
    this.openmct.time.off('timeSystemChanged', this.setTimeSystem);
  },
  methods: {
    addLadTable(domainObject) {
      let ladTable = {};
      ladTable.domainObject = domainObject;
      ladTable.key = this.openmct.objects.makeKeyString(domainObject.identifier);
      ladTable.objectPath = [domainObject, ...this.objectPath];
      this.ladTelemetryObjects[ladTable.key] = [];
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
      let index = this.ladTableObjects.findIndex(
        (ladTable) => this.openmct.objects.makeKeyString(identifier) === ladTable.key
      );
      let ladTable = this.ladTableObjects[index];
      this.$delete(this.ladTelemetryObjects, ladTable.key);
      this.ladTableObjects.splice(index, 1);
    },
    reorderLadTables(reorderPlan) {
      let oldComposition = this.ladTableObjects.slice();
      reorderPlan.forEach((reorderEvent) => {
        this.ladTableObjects[reorderEvent.newIndex] = oldComposition[reorderEvent.oldIndex];
      });
    },
    setTimeSystem(timesystem) {
      this.timesystem = timesystem.name;
    },
    initializeViewActions() {
      this.updatePausePlayActions();
      this.updateMarkedActions();
    },
    updateMarkedActions() {
      if (!this.viewActionsCollection) {
        return;
      }

      const action = this.markedRows.length > 0 ? 'enable' : 'disable';
      this.viewActionsCollection[action]([
        'channel-table-set-unmark-all',
        'channel-table-set-export-marked'
      ]);
    },
    updatePausePlayActions() {
      if (!this.viewActionsCollection) {
        return;
      }

      if (this.paused) {
        this.viewActionsCollection.hide(['pause-channel-table-set']);
        this.viewActionsCollection.show(['play-channel-table-set']);
      } else {
        this.viewActionsCollection.hide(['play-channel-table-set']);
        this.viewActionsCollection.show(['pause-channel-table-set']);
      }
    },
    addTelemetryObject(ladTable) {
      return (domainObject) => {
        let telemetryObject = {};
        telemetryObject.key = this.openmct.objects.makeKeyString(domainObject.identifier);
        telemetryObject.domainObject = domainObject;
        let telemetryObjects = this.ladTelemetryObjects[ladTable.key];
        telemetryObjects.push(telemetryObject);
        this.ladTelemetryObjects[ladTable.key] = telemetryObjects;
      };
    },
    removeTelemetryObject(ladTable) {
      return (identifier) => {
        let telemetryObjects = this.ladTelemetryObjects[ladTable.key];
        let index = telemetryObjects.findIndex(
          (telemetryObject) =>
            this.openmct.objects.makeKeyString(identifier) === telemetryObject.key
        );
        telemetryObjects.splice(index, 1);
        this.ladTelemetryObjects[ladTable.key] = telemetryObjects;
      };
    },
    updateViewContext(rowContext) {
      this.viewContext.row = rowContext;
    },
    togglePauseByButton() {
      if (this.paused) {
        this.unpause();
      } else {
        this.pause();
      }
    },
    pause() {
      this.paused = true;
    },
    unpause() {
      this.paused = false;
      this.undoMarkedRows();
    },
    isMarked(key) {
      return this.markedRows.some((markedRow) => markedRow.key === key);
    },
    findTelemetryObject(key) {
      for (const ladTable of this.ladTableObjects) {
        const found = (this.ladTelemetryObjects[ladTable.key] || []).find(
          (telemetryObject) => telemetryObject.key === key
        );
        if (found) {
          return found;
        }
      }

      return undefined;
    },
    markRow(key, keyModifier) {
      if (this.markedRows.length > 0 && !keyModifier) {
        this.undoMarkedRows();
      }

      const telemetryObject = this.findTelemetryObject(key);
      if (telemetryObject && !this.isMarked(key)) {
        this.markedRows = [...this.markedRows, { key, domainObject: telemetryObject.domainObject }];
      }

      this.pause();
    },
    unmarkRow(key) {
      // Replace (never mutate): the markedRows watcher is shallow and would
      // miss in-place changes, leaving mark actions out of sync.
      this.markedRows = this.markedRows.filter((markedRow) => markedRow.key !== key);

      if (this.markedRows.length === 0) {
        this.unpause();
      }
    },
    undoMarkedRows() {
      this.markedRows = [];
    },
    unmarkAllRows() {
      this.undoMarkedRows();
      this.unpause();
    },
    setRowRef(key, el) {
      if (el) {
        this.rowRefs[key] = el;
      } else {
        delete this.rowRefs[key];
      }
    },
    getSetRowData(keys) {
      const rows = [];

      this.ladTableObjects.forEach((ladTable) => {
        (this.ladTelemetryObjects[ladTable.key] || []).forEach((telemetryObject) => {
          if (keys && !keys.includes(telemetryObject.key)) {
            return;
          }

          const row = this.rowRefs[telemetryObject.key];
          rows.push({
            ID: sanitizeCsvFormulaInjection(row?.id ?? ''),
            Title: sanitizeCsvFormulaInjection(row?.name ?? ''),
            Value: row ? row.value : '---',
            [this.timesystem]: row ? row.formattedTimestamp : '---'
          });
        });
      });

      return rows;
    },
    exportAsCSV(data) {
      this.csvExporter.export(data, {
        filename: this.domainObject.name + '.csv',
        headers: ['ID', 'Title', 'Value', this.timesystem]
      });
    },
    exportAllDataAsCSV() {
      this.exportAsCSV(this.getSetRowData());
    },
    exportMarkedDataAsCSV() {
      const keys = this.markedRows.map((markedRow) => markedRow.key);
      this.exportAsCSV(this.getSetRowData(keys));
    },
    getViewContext() {
      return {
        ...this.viewContext,
        type: 'channel-table-set',
        togglePauseByButton: this.togglePauseByButton,
        unmarkAllRows: this.unmarkAllRows,
        exportAllDataAsCSV: this.exportAllDataAsCSV,
        exportMarkedDataAsCSV: this.exportMarkedDataAsCSV
      };
    }
  }
};
</script>
