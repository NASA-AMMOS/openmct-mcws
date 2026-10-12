<template>
  <div class="c-immediate-command" :class="{ 'is-collapsed': collapsed }">
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
          <label v-if="typeFilter !== 'sim'">
            Module
            <select v-model="moduleFilter">
              <option value="all">All</option>
              <option v-for="module in modules" :key="module" :value="module">
                {{ module }}
              </option>
            </select>
          </label>
        </div>
        <ul v-if="typeFilter !== 'sim'" class="c-immediate-command__list">
          <li v-for="stem in visibleStems" :key="stem">
            <button
              class="c-immediate-command__stem"
              :class="{ 'is-selected': stem === selectedStem }"
              @click="selectStem(stem)"
            >
              {{ stem }}
            </button>
          </li>
        </ul>
        <p v-else>Simulator commands are free text; enter them on the right.</p>
        <p v-if="typeFilter !== 'sim' && visibleStems.length === 0">
          No commands match.
        </p>
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
          v-for="argument in selectedCommand.arguments || []"
          :key="argument.name"
          class="c-form__row"
        >
          <label :for="argInputId(argument)">
            {{ argument.name }}
            <span v-if="isRequired(argument)">(required)</span>
          </label>
          <span v-if="argument.description">{{ argument.description }}</span>
          <select
            v-if="enumOptions(argument).length > 0"
            :id="argInputId(argument)"
            v-model="argValues[argument.name]"
          >
            <option v-for="symbol in enumOptions(argument)" :key="symbol" :value="symbol">
              {{ symbol }}
            </option>
          </select>
          <select
            v-else-if="isBooleanArgument(argument)"
            :id="argInputId(argument)"
            v-model="argValues[argument.name]"
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
          />
          <span v-if="argument.units">{{ argument.units }}</span>
          <span
            v-if="argErrors[argument.name]"
            class="c-immediate-command__error"
            role="alert"
          >
            {{ argErrors[argument.name] }}
          </span>
        </div>
        <p v-if="(selectedCommand.arguments || []).length === 0">
          This command takes no arguments.
        </p>
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
          Start and select an uplink session in Session Control to enable sending.
        </p>
      </div>
      <div v-if="result" class="c-immediate-command__result">
        Sent {{ result.commandId }} at {{ result.dispatchTime }}
      </div>
      <p v-if="sendError" class="c-immediate-command__error" role="alert">
        {{ sendError }}
      </p>
    </div>
  </div>
</template>

<script>
import datasetCache from 'services/dataset/DatasetCache.js';
import {
  buildCommandString,
  defaultArgumentValues,
  validateCommandArguments
} from '../commandArguments.js';

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
      moduleFilter: 'all',
      selectedStem: null,
      selectedGroup: null,
      selectedCommand: null,
      argValues: {},
      argErrors: {},
      simulatorText: '',
      result: null,
      sendError: null,
      sending: false,
      collapsed: false,
      typeFilters: TYPE_FILTERS
    };
  },
  computed: {
    modules() {
      const modules = new Set();

      this.stemsForType(this.typeFilter).forEach((stem) => {
        modules.add(stem.split('_')[0]);
      });

      return [...modules].sort();
    },
    visibleStems() {
      const query = this.searchText.trim().toLowerCase();
      const moduleOk =
        this.moduleFilter === 'all' || this.modules.includes(this.moduleFilter);

      return this.stemsForType(this.typeFilter).filter((stem) => {
        if (moduleOk && this.moduleFilter !== 'all') {
          if (stem.split('_')[0] !== this.moduleFilter) {
            return false;
          }
        }

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
  mounted() {
    this.initialize();
  },
  methods: {
    async initialize() {
      try {
        this.loadDatasets();

        if (this.datasetKey) {
          await this.loadDictionary();
        }
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
      this.result = null;
      this.sendError = null;
      this.collapsed = false;
    },
    onDatasetChange() {
      this.resetSelection();
      this.openmct.objects.mutate(
        this.domainObject,
        'configuration.datasetKey',
        this.datasetKey
      );
      this.loadDictionary();
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
    async send() {
      this.sendError = null;
      this.result = null;

      if (!this.missionControlService.canSendCommands()) {
        this.sendError = 'Select an attached uplink session in Session Control first.';

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
            this.argValues
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
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  overflow-y: auto;
}
.c-immediate-command.is-collapsed .c-immediate-command__sidebar {
  width: 120px;
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
}
.c-immediate-command__stem.is-selected,
.c-immediate-command__filters .is-active {
  font-weight: bold;
}
.c-immediate-command__detail {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
}
.c-immediate-command__simulator {
  width: 100%;
}
.c-immediate-command__error {
  font-weight: bold;
}
</style>
