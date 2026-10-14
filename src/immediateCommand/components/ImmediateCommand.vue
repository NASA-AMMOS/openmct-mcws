<template>
  <div
    class="c-immediate-command"
    :class="{ 'is-collapsed': collapsed, 'is-narrow': isNarrow }"
  >
    <div class="c-immediate-command__sidebar">
      <div class="c-immediate-command__dataset">
        <label>
          Dataset
          <select v-model="datasetKey" @change="onDatasetChange">
            <option v-for="dataset in datasets" :key="dataset.key" :value="dataset.key">
              {{ dataset.name }}
            </option>
          </select>
        </label>
      </div>
      <div v-show="!collapsed" class="c-immediate-command__browser">
        <input
          v-model="searchText"
          class="c-immediate-command__search"
          type="text"
          placeholder="Search stems"
          aria-label="Search command stems"
        />
        <div class="c-immediate-command__filters">
          <button
            v-for="filter in typeFilters"
            :key="filter.value"
            class="c-button"
            :class="{ 'is-active': typeFilter === filter.value }"
            @click="typeFilter = filter.value"
          >
            {{ filter.label }}
          </button>
        </div>
        <ul v-if="typeFilter !== 'sim'" class="c-immediate-command__list">
          <li v-for="stem in visibleStems" :key="stem">
            <button
              class="c-list-button c-immediate-command__stem"
              :class="{ 'is-selected': stem === selectedStem }"
              :title="stem"
              @click="selectStem(stem)"
            >
              {{ stem }}
            </button>
          </li>
        </ul>
        <p v-else>Simulator commands are free text; enter them on the right.</p>
        <p v-if="typeFilter !== 'sim' && visibleStems.length === 0">No commands match.</p>
      </div>
      <button class="c-button c-immediate-command__collapse" @click="collapsed = !collapsed">
        {{ collapsed ? 'Expand list' : 'Collapse list' }}
      </button>
    </div>
    <div class="c-immediate-command__detail">
      <p v-if="dictionaryError" class="c-immediate-command__error" role="alert">
        {{ dictionaryError }}
      </p>
      <template v-else-if="typeFilter === 'sim'">
        <h2>Simulator Command</h2>
        <textarea
          v-model="simulatorText"
          class="c-immediate-command__simulator"
          rows="4"
          placeholder="Enter simulator command string"
        ></textarea>
      </template>
      <template v-else-if="selectedCommand">
        <h2>{{ selectedStem }}</h2>
        <p>{{ selectedCommand.description }}</p>
        <div
          v-for="argument in formArguments"
          :key="argument.name"
          class="c-form__row c-immediate-command__arg-row"
        >
          <label :for="argInputId(argument)" class="c-immediate-command__arg-label">
            <span class="c-immediate-command__arg-name">{{ argument.name }}</span>
            <span v-if="isRequired(argument)">(required)</span>
            <span v-if="argument.description" class="c-immediate-command__arg-description">
              {{ argument.description }}
            </span>
            <span aria-hidden="true">:</span>
          </label>
          <div
            v-if="isRepeat(argument)"
            :id="argInputId(argument)"
            class="c-immediate-command__repeat"
          >
            <div class="c-immediate-command__repeat-mode">
              <button
                class="c-button"
                :class="{ 'is-active': !isRepeatJsonMode(argument) }"
                @click="setRepeatMode(argument, false)"
              >
                Form
              </button>
              <button
                class="c-button"
                :class="{ 'is-active': isRepeatJsonMode(argument) }"
                @click="setRepeatMode(argument, true)"
              >
                JSON
              </button>
              <span>{{ repeatHint(argument) }}</span>
            </div>
            <div v-if="isRepeatJsonMode(argument)">
              <textarea
                v-model="repeatJsonText[argument.name]"
                class="c-immediate-command__repeat-json"
                rows="6"
                :class="{ 'is-invalid': repeatJsonInvalid(argument) }"
                @change="applyRepeatJson(argument)"
              ></textarea>
              <p
                v-if="repeatJsonErrors[argument.name]"
                class="c-immediate-command__error"
                role="alert"
              >
                {{ repeatJsonErrors[argument.name] }}
              </p>
            </div>
            <template v-else>
              <div
                v-for="(set, setIndex) in argValues[argument.name] || []"
                :key="setIndex"
                class="c-immediate-command__repeat-set"
              >
                <span>Set {{ setIndex + 1 }}</span>
                <label v-for="child in repeatChildren(argument)" :key="child.name">
                  {{ child.name }}
                  <select
                    v-if="enumOptions(child).length > 0"
                    v-model="set[child.name]"
                    :class="{
                      'is-invalid': repeatCellInvalid(
                        argument,
                        setIndex,
                        child.name,
                        set[child.name]
                      )
                    }"
                    @change="validateForm"
                  >
                    <option v-for="symbol in enumOptions(child)" :key="symbol" :value="symbol">
                      {{ symbol }}
                    </option>
                  </select>
                  <select
                    v-else-if="isBooleanArgument(child)"
                    v-model="set[child.name]"
                    :class="{
                      'is-invalid': repeatCellInvalid(
                        argument,
                        setIndex,
                        child.name,
                        set[child.name]
                      )
                    }"
                    @change="validateForm"
                  >
                    <option v-for="form in booleanForms(child)" :key="form" :value="form">
                      {{ form }}
                    </option>
                  </select>
                  <input
                    v-else
                    v-model="set[child.name]"
                    type="text"
                    :placeholder="placeholderFor(child)"
                    :class="{
                      'is-invalid': repeatCellInvalid(
                        argument,
                        setIndex,
                        child.name,
                        set[child.name]
                      )
                    }"
                    @change="validateForm"
                  />
                </label>
                <button
                  class="c-button"
                  :disabled="!canRemoveSet(argument)"
                  @click="removeSet(argument, setIndex)"
                >
                  Remove set
                </button>
              </div>
              <button
                class="c-button"
                :disabled="!canAddSet(argument)"
                @click="addSet(argument)"
              >
                Add set
              </button>
            </template>
          </div>
          <select
            v-else-if="enumOptions(argument).length > 0"
            :id="argInputId(argument)"
            v-model="argValues[argument.name]"
            :class="{ 'is-invalid': inputInvalid(argument) }"
            @change="validateForm"
          >
            <option v-for="symbol in enumOptions(argument)" :key="symbol" :value="symbol">
              {{ symbol }}
            </option>
          </select>
          <select
            v-else-if="isBooleanArgument(argument)"
            :id="argInputId(argument)"
            v-model="argValues[argument.name]"
            :class="{ 'is-invalid': inputInvalid(argument) }"
            @change="validateForm"
          >
            <option v-for="form in booleanForms(argument)" :key="form" :value="form">
              {{ form }}
            </option>
          </select>
          <input
            v-else
            :id="argInputId(argument)"
            v-model="argValues[argument.name]"
            type="text"
            :placeholder="placeholderFor(argument)"
            :class="{ 'is-invalid': inputInvalid(argument) }"
            @change="validateForm"
          />
          <span v-if="showUnits(argument)" class="c-immediate-command__arg-units">
            {{ argument.units }}
          </span>
          <span v-if="argErrors[argument.name]" class="c-immediate-command__error" role="alert">
            {{ argErrors[argument.name] }}
          </span>
        </div>
        <p v-if="formArguments.length === 0">This command takes no arguments.</p>
      </template>
      <p v-else>Select a command from the list.</p>
      <div v-if="showSendRow" class="c-immediate-command__send">
        <button
          class="c-button c-button--major"
          :disabled="!canSend || sending || !readyToSend"
          @click="send"
        >
          Send
        </button>
        <p v-if="!canSend">
          Start and select an uplink session in the MCS status indicator to enable sending.
        </p>
      </div>
      <div v-if="result" class="c-immediate-command__result">
        Sent {{ result.commandId }} at {{ result.dispatchTime }}
      </div>
      <p v-if="sendError" class="c-immediate-command__error" role="alert">
        {{ sendError }}
      </p>
      <div v-if="sentCommands.length > 0" class="c-immediate-command__history">
        <h3>Sent commands</h3>
        <p>{{ statusSourceText }}</p>
        <div class="c-immediate-command__history-scroll">
          <table class="c-table c-immediate-command__history-table">
            <thead>
              <tr>
                <th>Dispatched</th>
                <th>Session</th>
                <th>Command</th>
                <th>Radiation status</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(entry, index) in sentCommands" :key="entry.commandId || index">
                <td>{{ entry.dispatchTime }}</td>
                <td>{{ entry.sessionId }}</td>
                <td>{{ entry.requested }}</td>
                <td>
                  {{ entry.status }}
                  <span v-if="entry.final">(final)</span>
                </td>
                <td>{{ statusDetail(entry) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <button class="c-button" :disabled="!canCheckStatus || checkingStatus" @click="checkStatus">
          Check status
        </button>
        <p v-if="statusError" class="c-immediate-command__error" role="alert">
          {{ statusError }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import datasetCache from 'services/dataset/DatasetCache.js';
import mcws from 'services/mcws/mcws.js';
import sessionServiceDefault from 'services/session/SessionService.js';
import {
  buildCommandString,
  defaultArgumentValues,
  emptyRepeatSet,
  inputArguments,
  isRepeatArgument,
  parseRepeatJson,
  repeatBounds,
  validateCommandArguments
} from '../commandArguments.js';
import { openCommandEventStream } from '../../missionControl/commandEventStream.js';
import { formatDayOfYear } from '../../missionControl/commandStatusTracker.js';

const STATUS_QUERY_SKEW_MS = 5000;
const STREAM_STATE_TEXT = {
  connecting: 'Connecting to the command event stream for live radiation status.',
  connected: 'Live radiation status from the command event stream.',
  disconnected: 'Command event stream disconnected; reconnecting.',
  closed: 'Command event stream closed.',
  idle: 'Select an uplink session to receive live radiation status.',
  noStream: 'This dataset has no command event stream; use Check status for radiation status.'
};

const TYPE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'fsw', label: 'Software' },
  { value: 'hw', label: 'Hardware' },
  { value: 'sim', label: 'Simulator' }
];

export default {
  inject: ['openmct', 'missionControlService', 'domainObject'],
  data() {
    return {
      datasets: [],
      datasetKey: null,
      dictionary: null,
      enumMap: {},
      fswStems: [],
      hwStems: [],
      dictionaryError: null,
      searchText: '',
      typeFilter: 'all',
      selectedStem: null,
      selectedGroup: null,
      selectedCommand: null,
      argValues: {},
      argErrors: {},
      repeatJsonMode: {},
      repeatJsonText: {},
      repeatJsonErrors: {},
      simulatorText: '',
      result: null,
      sendError: null,
      sending: false,
      collapsed: false,
      isNarrow: false,
      typeFilters: TYPE_FILTERS,
      streamState: 'idle',
      checkingStatus: false,
      statusError: null
    };
  },
  computed: {
    formArguments() {
      return inputArguments(this.selectedCommand);
    },
    sentCommands() {
      return this.missionControlService.commandStatus.entries;
    },
    selectedUplinkSessionId() {
      return this.missionControlService.selectedUplinkSessionId;
    },
    statusSourceText() {
      return STREAM_STATE_TEXT[this.streamState] || '';
    },
    canCheckStatus() {
      return Boolean(this.currentDataset()?.options?.commandEventUrl);
    },
    visibleStems() {
      const query = this.searchText.trim().toLowerCase();

      return this.stemsForType(this.typeFilter).filter((stem) => {
        return stem.toLowerCase().includes(query);
      });
    },
    canSend() {
      return this.missionControlService.canSendCommands();
    },
    showSendRow() {
      return !this.dictionaryError && (this.typeFilter === 'sim' || this.selectedCommand);
    },
    readyToSend() {
      if (this.typeFilter === 'sim') {
        return this.simulatorText.trim().length > 0;
      }

      return Boolean(this.selectedCommand);
    }
  },
  watch: {
    selectedUplinkSessionId() {
      this.reopenStream();
    }
  },
  mounted() {
    this.initialize();
    this.unlistenSession = sessionServiceDefault().listen(() => {
      // Let the dataset's CommandDictionary react to the session change first.
      setTimeout(() => this.reloadIfDictionaryChanged(), 0);
    });
    this.resizeObserver = new ResizeObserver(() => this.updateNarrow());
    this.resizeObserver.observe(this.$el);
    this.updateNarrow();
  },
  beforeUnmount() {
    if (this.unlistenSession) {
      this.unlistenSession();
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    this.closeStream();
  },
  methods: {
    currentDataset() {
      return this.datasetKey ? (datasetCache().datasets?.[this.datasetKey] ?? null) : null;
    },
    activeDictionaryUrl() {
      return this.currentDataset()?.getActiveCommandDictionaryUrl?.() ?? null;
    },
    reloadIfDictionaryChanged() {
      if (this.activeDictionaryUrl() === this.loadedDictionaryUrl) {
        return;
      }

      this.resetSelection();
      this.loadDictionary();
    },
    uplinkTopic(sessionId) {
      const uplink = this.missionControlService.getUplinkSession(sessionId);

      if (uplink?.topic) {
        return uplink.topic;
      }

      const tracking = this.missionControlService.state.trackingSessions.find(
        (session) => session.number === sessionId
      );

      return tracking?.topic ?? null;
    },
    closeStream() {
      if (this.stream) {
        this.stream.close();
        this.stream = null;
      }
    },
    reopenStream() {
      this.closeStream();

      const url = this.currentDataset()?.options?.commandEventStreamUrl;
      const sessionId = this.selectedUplinkSessionId;

      if (!url) {
        this.streamState = 'noStream';

        return;
      }

      if (sessionId === null || sessionId === undefined) {
        this.streamState = 'idle';

        return;
      }

      try {
        this.stream = openCommandEventStream({
          url,
          sessionId,
          topic: this.uplinkTopic(sessionId),
          onRows: (rows) => this.missionControlService.commandStatus.ingest(rows),
          onStateChange: (state) => {
            this.streamState = state;
          }
        });
      } catch (error) {
        this.streamState = 'noStream';
        this.statusError = `Could not open the command event stream: ${error.message}`;
      }
    },
    async checkStatus() {
      const url = this.currentDataset()?.options?.commandEventUrl;
      const tracker = this.missionControlService.commandStatus;

      if (!url) {
        return;
      }

      const earliest = tracker.earliestPendingTime();
      const sessionIds = [
        ...new Set(
          this.sentCommands
            .filter((entry) => !entry.final && entry.sessionId !== null)
            .map((entry) => entry.sessionId)
        )
      ];

      this.checkingStatus = true;
      this.statusError = null;

      try {
        for (const sessionId of sessionIds) {
          const filter = { session_id: sessionId };

          if (earliest !== null) {
            filter.event_time__gte = formatDayOfYear(earliest - STATUS_QUERY_SKEW_MS);
          }

          const rows = await mcws.dataTable(url).read({ filter, sort: 'event_time' });

          tracker.ingest(Array.isArray(rows) ? rows : []);
        }
      } catch (error) {
        this.statusError = `Status check failed: ${error.message ?? error.status ?? error}`;
      } finally {
        this.checkingStatus = false;
      }
    },
    statusDetail(entry) {
      if (entry.failReason && entry.failReason !== 'NONE') {
        return entry.failReason;
      }

      return entry.scmfFile || '';
    },
    isRepeat(argument) {
      return isRepeatArgument(argument);
    },
    repeatChildren(argument) {
      return inputArguments(argument?.repeat?.arguments || []);
    },
    repeatHint(argument) {
      const { min, max } = repeatBounds(argument);

      return max === null ? `At least ${min} set(s)` : `${min} to ${max} set(s)`;
    },
    canAddSet(argument) {
      const { max } = repeatBounds(argument);

      return max === null || (this.argValues[argument.name] || []).length < max;
    },
    canRemoveSet(argument) {
      const { min } = repeatBounds(argument);

      return (this.argValues[argument.name] || []).length > min;
    },
    addSet(argument) {
      this.argValues[argument.name] = [
        ...(this.argValues[argument.name] || []),
        emptyRepeatSet(argument)
      ];
    },
    removeSet(argument, setIndex) {
      this.argValues[argument.name] = (this.argValues[argument.name] || []).filter(
        (set, index) => index !== setIndex
      );
    },
    isRepeatJsonMode(argument) {
      return this.repeatJsonMode[argument.name] === true;
    },
    setRepeatMode(argument, json) {
      if (json) {
        this.repeatJsonText[argument.name] = JSON.stringify(
          this.argValues[argument.name] || [],
          null,
          2
        );
        this.repeatJsonErrors[argument.name] = null;
      } else {
        this.repeatJsonErrors[argument.name] = null;
      }

      this.repeatJsonMode[argument.name] = json;
    },
    applyRepeatJson(argument) {
      const { sets, error } = parseRepeatJson(
        argument,
        this.repeatJsonText[argument.name] ?? '',
        this.enumMap
      );

      if (error) {
        this.repeatJsonErrors[argument.name] = error;

        return;
      }

      this.repeatJsonErrors[argument.name] = null;
      this.argValues[argument.name] = sets;
      this.validateForm();
    },
    async initialize() {
      try {
        this.loadDatasets();

        if (this.datasetKey) {
          await this.loadDictionary();
        }

        await this.missionControlService.refreshTrackingSessions().catch(() => {});
        this.reopenStream();
      } catch (error) {
        this.dictionaryError = error.message;
      }
    },
    loadDatasets() {
      const cache = datasetCache();

      this.datasets = Object.entries(cache.datasets || {}).map(([key, dataset]) => ({
        key,
        name: dataset.options?.name ?? key
      }));

      const storedKey = this.domainObject.configuration?.datasetKey ?? null;

      if (storedKey && this.datasets.some((dataset) => dataset.key === storedKey)) {
        this.datasetKey = storedKey;
      } else if (this.datasets.length > 0) {
        this.datasetKey = this.datasets[0].key;
      } else {
        this.datasetKey = null;
      }
    },
    async loadDictionary() {
      this.dictionaryError = null;
      this.dictionary = null;

      try {
        const cache = datasetCache();
        const dataset = this.datasetKey ? cache.datasets[this.datasetKey] : null;

        if (!dataset?.commands) {
          this.dictionaryError = 'The selected dataset has no command dictionary.';

          return;
        }

        this.loadedDictionaryUrl = dataset.getActiveCommandDictionaryUrl?.() ?? null;
        await dataset.commands.getGroups();
        this.dictionary = dataset.commands;
        this.enumMap = dataset.commands.dictionary?.enumMap ?? {};
        this.fswStems = await dataset.commands.getGroupCommandStems('fsw');
        this.hwStems = await dataset.commands.getGroupCommandStems('hw');
      } catch (error) {
        this.dictionaryError = error.message;
      }
    },
    resetSelection() {
      this.selectedStem = null;
      this.selectedGroup = null;
      this.selectedCommand = null;
      this.argValues = {};
      this.argErrors = {};
      this.repeatJsonMode = {};
      this.repeatJsonText = {};
      this.repeatJsonErrors = {};
      this.result = null;
      this.sendError = null;
      this.collapsed = false;
    },
    onDatasetChange() {
      this.resetSelection();
      this.openmct.objects.mutate(this.domainObject, 'configuration.datasetKey', this.datasetKey);
      this.loadDictionary();
      this.reopenStream();
    },
    stemsForType(typeFilter) {
      if (typeFilter === 'fsw') {
        return this.fswStems;
      }

      if (typeFilter === 'hw') {
        return this.hwStems;
      }

      if (typeFilter === 'sim') {
        return [];
      }

      return [...this.fswStems, ...this.hwStems];
    },
    async selectStem(stem) {
      this.sendError = null;
      this.result = null;
      this.selectedStem = stem;
      this.selectedGroup = this.fswStems.includes(stem) ? 'fsw' : 'hw';

      try {
        const command = await this.dictionary.getCommand(stem);

        if (!command || command.status === 'missing') {
          this.selectedCommand = null;
          this.sendError = `Unknown command: ${stem}`;

          return;
        }

        this.selectedCommand = command;
        this.argValues = defaultArgumentValues(command);
        this.argErrors = {};
        this.collapsed = true;
      } catch (error) {
        this.selectedCommand = null;
        this.sendError = error.message;
      }
    },
    isRequired(argument) {
      if (isRepeatArgument(argument)) {
        return false;
      }

      return argument.default_value === undefined || argument.default_value === null;
    },
    isBooleanArgument(argument) {
      return (argument.arg_type || '').toLowerCase() === 'boolean';
    },
    enumOptions(argument) {
      const enumDefinition = this.enumMap[argument.enum_name];

      if (!enumDefinition) {
        return [];
      }

      return (enumDefinition.values || []).map((entry) => entry.symbol);
    },
    booleanForms(argument) {
      const format = argument.format || {};
      const forms = [];

      if (format.true_str !== undefined && format.true_str !== null) {
        forms.push(format.true_str);
      } else {
        forms.push('TRUE');
      }

      if (format.false_str !== undefined && format.false_str !== null) {
        forms.push(format.false_str);
      } else {
        forms.push('FALSE');
      }

      return forms;
    },
    argInputId(argument) {
      return `arg-${argument.name}`;
    },
    placeholderFor(argument) {
      if (this.isRequired(argument)) {
        return '';
      }

      return `Default: ${argument.default_value}`;
    },
    updateNarrow() {
      this.isNarrow = this.$el.clientWidth <= 600;
    },
    showUnits(argument) {
      const units = (argument.units ?? '').trim();

      return units !== '' && units.toLowerCase() !== 'none';
    },
    validateForm() {
      if (this.typeFilter === 'sim' || this.selectedGroup === 'hw' || !this.selectedCommand) {
        return;
      }

      this.argErrors = validateCommandArguments(
        this.selectedCommand,
        this.argValues,
        this.enumMap
      ).errors;
    },
    hasValue(value) {
      return value !== undefined && value !== null && value !== '';
    },
    inputInvalid(argument) {
      return Boolean(this.argErrors[argument.name]) && this.hasValue(this.argValues[argument.name]);
    },
    repeatCellInvalid(argument, setIndex, childName, cellValue) {
      const error = this.argErrors[argument.name];

      if (!error || !this.hasValue(cellValue)) {
        return false;
      }

      return error.startsWith(`Set ${setIndex + 1}, ${childName}:`);
    },
    repeatJsonInvalid(argument) {
      const text = this.repeatJsonText[argument.name] ?? '';

      return Boolean(this.repeatJsonErrors[argument.name]) && text.trim() !== '';
    },
    async send() {
      this.sendError = null;
      this.result = null;

      if (!this.missionControlService.canSendCommands()) {
        this.sendError = 'Select an attached uplink session in the MCS indicator first.';

        return;
      }

      const sessionId = this.missionControlService.selectedUplinkSessionId;

      this.sending = true;

      try {
        if (this.typeFilter === 'sim') {
          const commandString = this.simulatorText.trim();

          if (!commandString) {
            this.sendError = 'Enter a simulator command.';

            return;
          }

          this.result = await this.missionControlService.sendSimulatorCommand({
            sessionId,
            commandString
          });
        } else if (this.selectedGroup === 'hw') {
          this.result = await this.missionControlService.sendHardwareCommand({
            sessionId,
            commandStem: this.selectedStem
          });
        } else {
          const repeatError = Object.values(this.repeatJsonErrors).find((error) => error);

          if (repeatError) {
            this.sendError = 'Fix the repeat JSON errors before sending.';

            return;
          }

          const { valid, errors } = validateCommandArguments(
            this.selectedCommand,
            this.argValues,
            this.enumMap
          );

          this.argErrors = errors;

          if (!valid) {
            return;
          }

          const commandString = buildCommandString(
            this.selectedStem,
            this.selectedCommand,
            this.argValues,
            this.enumMap
          );

          this.result = await this.missionControlService.sendFlightSoftwareCommand({
            sessionId,
            commandString
          });
        }
      } catch (error) {
        this.sendError = error.message;
      } finally {
        this.sending = false;
      }
    }
  }
};
</script>

<style scoped>
.c-immediate-command {
  display: flex;
  flex-direction: row;
  height: 100%;
  overflow: hidden;
}
.c-immediate-command__sidebar {
  width: min(320px, 45%);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  overflow-y: auto;
}
.c-immediate-command__dataset select {
  max-width: 100%;
}
.c-immediate-command__search {
  width: 100%;
  box-sizing: border-box;
}
.c-immediate-command__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}
.c-immediate-command.is-collapsed .c-immediate-command__sidebar {
  width: 32px;
  padding: 12px 4px;
  align-items: center;
}
.c-immediate-command.is-collapsed .c-immediate-command__dataset {
  display: none;
}
.c-immediate-command.is-collapsed .c-immediate-command__collapse {
  writing-mode: vertical-rl;
  white-space: nowrap;
  flex: 1;
}
.c-immediate-command__list {
  list-style: none;
  margin: 8px 0;
  padding: 0;
  overflow-y: auto;
}
.c-immediate-command__stem {
  width: 100%;
  text-align: left;
  white-space: normal;
  word-break: break-word;
  color: inherit;
}
.c-immediate-command__stem.is-selected,
.c-immediate-command__filters .is-active {
  font-weight: bold;
}
.c-immediate-command__detail {
  flex: 1;
  min-width: 0;
  min-height: 0;
  padding: 12px;
  overflow-y: auto;
}
.c-immediate-command__arg-row {
  display: grid;
  grid-template-columns: minmax(140px, 320px) minmax(0, 1fr) auto auto;
  gap: 4px 12px;
  align-items: start;
}
.c-immediate-command__arg-label {
  text-align: right;
  overflow-wrap: break-word;
}
.c-immediate-command__arg-name {
  font-weight: bold;
}
.c-immediate-command__arg-description {
  opacity: 0.8;
}
.c-immediate-command__detail input,
.c-immediate-command__detail select,
.c-immediate-command__detail textarea {
  background-color: #ffffff;
  color: #000000;
  max-width: 100%;
  box-sizing: border-box;
}
.c-immediate-command__detail input.is-invalid,
.c-immediate-command__detail select.is-invalid,
.c-immediate-command__detail textarea.is-invalid {
  background-color: #f8d7da;
}
.c-immediate-command__simulator {
  width: 100%;
}
.c-immediate-command__error {
  font-weight: bold;
}
.c-immediate-command__repeat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.c-immediate-command__repeat-set {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  align-items: baseline;
}
.c-immediate-command__repeat-mode {
  display: flex;
  gap: 4px;
  align-items: baseline;
}
.c-immediate-command__repeat-mode .is-active {
  font-weight: bold;
}
.c-immediate-command__repeat-json {
  width: 100%;
  font-family: monospace;
}
.c-immediate-command__history-scroll {
  overflow-x: auto;
  margin: 8px 0;
}
.c-immediate-command__history-table {
  border-collapse: collapse;
  width: 100%;
}
.c-immediate-command__history-table th,
.c-immediate-command__history-table td {
  padding: 2px 6px;
  text-align: left;
  white-space: nowrap;
}
.c-immediate-command.is-narrow {
  flex-direction: column;
}
.c-immediate-command.is-narrow .c-immediate-command__sidebar {
  width: auto;
  max-height: 42%;
  flex-shrink: 0;
}
.c-immediate-command.is-narrow.is-collapsed .c-immediate-command__sidebar {
  width: auto;
  max-height: none;
  padding: 8px 12px;
}
.c-immediate-command.is-narrow.is-collapsed .c-immediate-command__dataset {
  display: block;
}
.c-immediate-command.is-narrow.is-collapsed .c-immediate-command__collapse {
  writing-mode: horizontal-tb;
  flex: none;
}
.c-immediate-command.is-narrow .c-immediate-command__arg-row {
  grid-template-columns: 1fr;
}
.c-immediate-command.is-narrow .c-immediate-command__arg-label {
  text-align: left;
}
</style>
