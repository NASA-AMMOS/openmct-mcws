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
    <div class="c-inspect-properties__header">Pause Timer</div>
    <ul class="c-inspect-properties__section">
      <li class="c-inspect-properties__row">
        <div
          class="c-inspect-properties__label"
          title="Auto-resume a paused table after this many seconds"
        >
          <label for="evr-pause-timer-seconds">Auto-resume after (seconds)</label>
        </div>
        <div class="c-inspect-properties__value">
          <input
            v-if="isEditing"
            id="evr-pause-timer-seconds"
            v-model="pauseTimerInput"
            type="number"
            min="1"
            step="1"
            placeholder="Off"
            @change="updatePauseTimer"
          />
          <span v-if="!isEditing">{{ pauseTimerLabel }}</span>
        </div>
      </li>
    </ul>
    <div class="c-inspect-properties__header">Columns</div>
    <ul class="c-inspect-properties__section">
      <li v-for="(title, key) in headers" :key="key" class="c-inspect-properties__row">
        <div class="c-inspect-properties__label" title="Show or hide column">
          <label :for="key + 'ColumnControl'">{{ title }}</label>
        </div>
        <div class="c-inspect-properties__value">
          <input
            v-if="isEditing"
            :id="key + 'ColumnControl'"
            type="checkbox"
            :checked="configuration.hiddenColumns[key] !== true"
            @change="toggleColumn(key)"
          />
          <span v-if="!isEditing && configuration.hiddenColumns[key] !== true">Visible</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
// EVR fork of core's TableConfiguration.vue (openmct 4.3.1): identical
// Layout/Columns behaviour, plus the Pause Timer section (#506) between
// them. Keep in sync with core when the table configuration changes.
import TelemetryTableColumn from 'openmct.tables.TelemetryTableColumn';
import TelemetryTableUnitColumn from 'openmct.tables.TelemetryTableUnitColumn';

export default {
  inject: ['tableConfiguration', 'openmct'],
  data() {
    const configuration = this.tableConfiguration.getConfiguration();
    const pauseTimerSeconds = configuration.pauseTimerSeconds;

    return {
      headers: {},
      isEditing: this.openmct.editor.isEditing(),
      configuration,
      pauseTimerInput:
        pauseTimerSeconds === undefined || pauseTimerSeconds === null
          ? ''
          : String(pauseTimerSeconds)
    };
  },
  computed: {
    pauseTimerLabel() {
      const seconds = this.configuration.pauseTimerSeconds;

      return seconds === undefined || seconds === null ? 'Off' : `${seconds}s`;
    }
  },
  async mounted() {
    this.unlisteners = [];
    this.openmct.editor.on('isEditing', this.toggleEdit);
    const compositionCollection = this.openmct.composition.get(
      this.tableConfiguration.domainObject
    );

    const composition = await compositionCollection.load();
    this.addColumnsForAllObjects(composition);
    this.updateHeaders(this.tableConfiguration.getAllHeaders());

    compositionCollection.on('add', this.addObject);
    this.unlisteners.push(
      compositionCollection.off.bind(compositionCollection, 'add', this.addObject)
    );

    compositionCollection.on('remove', this.removeObject);
    this.unlisteners.push(
      compositionCollection.off.bind(compositionCollection, 'remove', this.removeObject)
    );
  },
  unmounted() {
    this.tableConfiguration.destroy();
    this.openmct.editor.off('isEditing', this.toggleEdit);
    this.unlisteners.forEach((unlisten) => unlisten());
  },
  methods: {
    updateHeaders(headers) {
      // add name column if it doesn't exist,
      // it's always the first column when it's manually added
      if (!headers.name) {
        headers = {
          name: 'Name',
          ...headers
        };
      }

      this.headers = headers;
    },
    toggleColumn(key) {
      let isHidden = this.configuration.hiddenColumns[key] === true;

      this.configuration.hiddenColumns[key] = !isHidden;
      this.tableConfiguration.updateConfiguration(this.configuration);
    },
    addObject(domainObject) {
      this.addColumnsForObject(domainObject, true);
      this.updateHeaders(this.tableConfiguration.getAllHeaders());
    },
    removeObject(objectIdentifier) {
      this.tableConfiguration.removeColumnsForObject(objectIdentifier, true);
      this.updateHeaders(this.tableConfiguration.getAllHeaders());
    },
    toggleEdit(isEditing) {
      this.isEditing = isEditing;
    },
    toggleAutosize() {
      this.configuration.autosize = !this.configuration.autosize;
      this.tableConfiguration.updateConfiguration(this.configuration);
    },
    addColumnsForAllObjects(objects) {
      objects.forEach((object) => this.addColumnsForObject(object, false));
    },
    addColumnsForObject(telemetryObject) {
      const metadata = this.openmct.telemetry.getMetadata(telemetryObject);
      let metadataValues = metadata ? metadata.values() : [];
      metadataValues.forEach((metadatum) => {
        let column = new TelemetryTableColumn(this.openmct, metadatum);
        this.tableConfiguration.addSingleColumnForObject(telemetryObject, column);
        // if units are available, need to add columns to be hidden
        if (metadatum.unit !== undefined) {
          let unitColumn = new TelemetryTableUnitColumn(this.openmct, metadatum);
          this.tableConfiguration.addSingleColumnForObject(telemetryObject, unitColumn);
        }
      });
    },
    toggleHeaderVisibility() {
      let hideHeaders = this.configuration.hideHeaders;

      this.configuration.hideHeaders = !hideHeaders;
      this.tableConfiguration.updateConfiguration(this.configuration);
    },
    updatePauseTimer() {
      const trimmed = String(this.pauseTimerInput).trim();

      if (trimmed === '') {
        this.configuration.pauseTimerSeconds = null;
        this.tableConfiguration.updateConfiguration(this.configuration);

        return;
      }

      const seconds = Number(trimmed);

      if (!Number.isFinite(seconds) || seconds <= 0) {
        const persisted = this.configuration.pauseTimerSeconds;
        this.pauseTimerInput =
          persisted === undefined || persisted === null ? '' : String(persisted);

        return;
      }

      const wholeSeconds = Math.floor(seconds);
      this.pauseTimerInput = String(wholeSeconds);
      this.configuration.pauseTimerSeconds = wholeSeconds;
      this.tableConfiguration.updateConfiguration(this.configuration);
    }
  }
};
</script>
