<template>
  <table
    class="c-table c-lad-table"
    :class="{ 'fixed-layout': hasManualWidths }"
    :style="tableStyle"
  >
    <thead>
      <tr>
        <th :style="columnStyle('id')">
          <div class="c-lad-table-set__header-content" style="position: relative">
            ID
            <div
              class="c-telemetry-table__resize-hitarea"
              @mousedown="resizeColumnStart($event, 'id')"
            ></div>
          </div>
        </th>
        <th :style="columnStyle('title')">
          <div class="c-lad-table-set__header-content" style="position: relative">
            Title
            <div
              class="c-telemetry-table__resize-hitarea"
              @mousedown="resizeColumnStart($event, 'title')"
            ></div>
          </div>
        </th>
        <th :style="columnStyle('value')">
          <div class="c-lad-table-set__header-content" style="position: relative">
            Value
            <div
              class="c-telemetry-table__resize-hitarea"
              @mousedown="resizeColumnStart($event, 'value')"
            ></div>
          </div>
        </th>
        <th :style="columnStyle('timestamp')">
          <div class="c-lad-table-set__header-content" style="position: relative">
            {{ timesystem }}
            <div
              class="c-telemetry-table__resize-hitarea"
              @mousedown="resizeColumnStart($event, 'timestamp')"
            ></div>
          </div>
        </th>
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
          :column-widths="columnWidths"
          @mark="markRow"
          @unmark="unmarkRow"
          @mark-multiple-concurrent="markMultipleConcurrentRows"
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
      markedRows: [],
      columnWidths: {}
    };
  },
  computed: {
    hasManualWidths() {
      return Object.keys(this.columnWidths).length > 0;
    },
    tableStyle() {
      // Manual widths need room: like core's sizing table, pin the table
      // to the columns' total so wider columns scroll instead of squeeze.
      const widths = Object.values(this.columnWidths);
      if (!widths.length) {
        return {};
      }

      return { width: widths.reduce((total, width) => total + width, 0) + 'px' };
    }
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
    this.applyConfiguration();
    this.unobserveConfiguration = this.openmct.objects.observe(
      this.domainObject,
      'configuration',
      this.handleConfigurationChange
    );
    this.resizeKey = undefined;
    this.resizeStartX = undefined;
    this.resizeStartWidth = undefined;
    this.resizeHeaderEl = undefined;
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
    this.unobserveConfiguration?.();
    // Mid-drag unmount: the once-only mouseup already fired or never will,
    // but the mousemove listener would leak without this.
    document.removeEventListener('mousemove', this.resizeColumnMove);
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
    applyConfiguration() {
      // Autosize (the default) means natural widths; persisted widths only
      // apply once the user drags a column or unticks Auto-size, either of
      // which stores autosize: false.
      const configuration = this.domainObject.configuration || {};
      this.columnWidths =
        configuration.autosize === false ? { ...(configuration.columnWidths || {}) } : {};
    },
    handleConfigurationChange() {
      this.applyConfiguration();
    },
    expandColumns() {
      // Non-persisted: freeze every column at its content width, like core.
      // Must clear first so the measurement sees natural widths rather
      // than the current manual ones.
      this.columnWidths = {};
      const table = this.$el;
      this.$nextTick(() => {
        if (!table.isConnected) {
          return;
        }

        const keys = ['id', 'title', 'value', 'timestamp'];
        const headers = table.querySelectorAll('thead th');
        const widths = {};
        keys.forEach((key, index) => {
          if (headers[index]) {
            widths[key] = headers[index].offsetWidth;
          }
        });
        this.columnWidths = widths;
      });
    },
    autosizeColumns() {
      // Non-persisted: drop manual widths so the table fits its container.
      this.columnWidths = {};
    },
    columnStyle(key) {
      // Width and max-width mirror core TableColumnHeader so body cells
      // line up. The header itself stays static: positioned headers would
      // paint above the previous column's handle (core keeps them static
      // for the same reason); the handle anchors to the relative wrapper.
      const width = this.columnWidths[key];
      if (!width) {
        return {};
      }

      return { width: width + 'px', 'max-width': width + 'px' };
    },
    resizeColumnStart(event, key) {
      this.captureNaturalWidths();
      this.resizeKey = key;
      this.resizeStartX = event.clientX;
      this.resizeHeaderEl = event.currentTarget.closest('th');
      this.resizeStartWidth = this.columnWidths[key] || this.resizeHeaderEl.offsetWidth;

      document.addEventListener('mouseup', this.resizeColumnEnd, {
        once: true,
        capture: true
      });
      document.addEventListener('mousemove', this.resizeColumnMove);
      event.preventDefault();
    },
    captureNaturalWidths() {
      // First manual sizing freezes every column at its rendered width so
      // the dragged column grows the table instead of squeezing siblings.
      // Never overwrites widths the user already set.
      const keys = ['id', 'title', 'value', 'timestamp'];
      const headers = this.$el.querySelectorAll('thead th');
      keys.forEach((key, index) => {
        if (!this.columnWidths[key] && headers[index]) {
          this.columnWidths[key] = headers[index].offsetWidth;
        }
      });
    },
    resizeColumnMove(event) {
      const newWidth = this.resizeStartWidth + (event.clientX - this.resizeStartX);
      const minWidth = parseInt(window.getComputedStyle(this.resizeHeaderEl).minWidth, 10);
      if (newWidth > minWidth) {
        this.columnWidths[this.resizeKey] = newWidth;
      }
    },
    resizeColumnEnd(event) {
      this.resizeKey = undefined;
      this.resizeStartX = undefined;
      this.resizeStartWidth = undefined;
      this.resizeHeaderEl = undefined;
      document.removeEventListener('mousemove', this.resizeColumnMove);
      event.preventDefault();
      event.stopPropagation();

      // Persist like core TelemetryTableConfiguration: manual widths win.
      const configuration = {
        ...(this.domainObject.configuration || {}),
        autosize: false,
        columnWidths: { ...this.columnWidths }
      };
      this.openmct.objects.mutate(this.domainObject, 'configuration', configuration);
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
    markRow(key) {
      // Marks always accumulate (unlike the channel table's replace on
      // plain click): once paused, every clicked row adds to the marks.
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
    allChannelKeys() {
      const keys = [];

      this.ladTableObjects.forEach((ladTable) => {
        (this.ladTelemetryObjects[ladTable.key] || []).forEach((telemetryObject) => {
          keys.push(telemetryObject.key);
        });
      });

      return keys;
    },
    markMultipleConcurrentRows(key) {
      if (!this.markedRows.length) {
        this.markRow(key);

        return;
      }

      const anchor = this.markedRows[0];
      const keys = this.allChannelKeys();
      let firstIndex = keys.indexOf(anchor.key);
      let lastIndex = keys.indexOf(key);

      if (firstIndex === -1 || lastIndex === -1) {
        this.markRow(key);

        return;
      }

      // Supports backward selection.
      if (lastIndex < firstIndex) {
        [firstIndex, lastIndex] = [lastIndex, firstIndex];
      }

      this.markedRows = keys.slice(firstIndex, lastIndex + 1).map((rangeKey) => {
        const existing = this.markedRows.find((markedRow) => markedRow.key === rangeKey);
        if (existing) {
          return existing;
        }

        return { key: rangeKey, domainObject: this.findTelemetryObject(rangeKey).domainObject };
      });
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
        expandColumns: this.expandColumns,
        autosizeColumns: this.autosizeColumns,
        togglePauseByButton: this.togglePauseByButton,
        unmarkAllRows: this.unmarkAllRows,
        exportAllDataAsCSV: this.exportAllDataAsCSV,
        exportMarkedDataAsCSV: this.exportMarkedDataAsCSV
      };
    }
  }
};
</script>
