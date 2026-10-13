<template>
  <div class="c-command-detail">
    <template v-if="definition && !isMissing">
      <h2 class="c-command-detail__stem">{{ stem }}</h2>
      <dl class="c-command-detail__meta">
        <dt>Type</dt>
        <dd>{{ typeLabel }}</dd>
        <dt v-if="definition.description">Description</dt>
        <dd v-if="definition.description">{{ definition.description }}</dd>
      </dl>

      <h3>Arguments ({{ allArguments.length }})</h3>
      <p v-if="allArguments.length === 0">This command takes no arguments.</p>
      <section
        v-for="argument in allArguments"
        :key="argument.name"
        class="c-command-detail__argument"
      >
        <h4>
          {{ argument.name }}
          <span class="c-command-detail__type">({{ argumentTypeLabel(argument) }})</span>
          <span v-if="isFill(argument)" class="c-command-detail__flag">fill, not input</span>
          <span v-else-if="isRequired(argument)" class="c-command-detail__flag">required</span>
        </h4>
        <p v-if="argument.description">{{ argument.description }}</p>
        <dl class="c-command-detail__meta">
          <template v-if="argument.units">
            <dt>Units</dt>
            <dd>{{ argument.units }}</dd>
          </template>
          <template v-if="formatRange(argument)">
            <dt>Range</dt>
            <dd>{{ formatRange(argument) }}</dd>
          </template>
          <template v-if="argument.default_value !== undefined && argument.default_value !== null">
            <dt>Default</dt>
            <dd>{{ argument.default_value }}</dd>
          </template>
          <template v-if="argument.bit_length !== undefined && argument.bit_length !== null">
            <dt>Bit length</dt>
            <dd>{{ argument.bit_length }}</dd>
          </template>
          <template
            v-if="argument.max_bit_length !== undefined && argument.max_bit_length !== null"
          >
            <dt>Max bit length</dt>
            <dd>{{ argument.max_bit_length }}</dd>
          </template>
          <template v-if="argument.valid_regex">
            <dt>Valid pattern</dt>
            <dd>{{ argument.valid_regex }}</dd>
          </template>
          <template v-if="isBoolean(argument)">
            <dt>Boolean forms</dt>
            <dd>{{ booleanForms(argument).join(' / ') }}</dd>
          </template>
        </dl>
        <table
          v-if="enumValues(argument).length > 0"
          class="c-command-detail__enum-table"
        >
          <caption>
            Enumeration {{ argument.enum_name }}
          </caption>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Numeric</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in enumValues(argument)" :key="entry.symbol">
              <td>{{ entry.symbol }}</td>
              <td>{{ entry.numeric ?? entry.value ?? '' }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="isRepeat(argument)" class="c-command-detail__repeat">
          <p>Repeat sets: {{ repeatRange(argument) }}</p>
          <div
            v-for="child in repeatChildren(argument)"
            :key="child.name"
            class="c-command-detail__repeat-child"
          >
            <h5>
              {{ child.name }}
              <span class="c-command-detail__type">({{ argumentTypeLabel(child) }})</span>
            </h5>
            <p v-if="child.description">{{ child.description }}</p>
            <dl class="c-command-detail__meta">
              <template v-if="child.units">
                <dt>Units</dt>
                <dd>{{ child.units }}</dd>
              </template>
              <template v-if="formatRange(child)">
                <dt>Range</dt>
                <dd>{{ formatRange(child) }}</dd>
              </template>
              <template v-if="child.default_value !== undefined && child.default_value !== null">
                <dt>Default</dt>
                <dd>{{ child.default_value }}</dd>
              </template>
            </dl>
            <table v-if="enumValues(child).length > 0" class="c-command-detail__enum-table">
              <caption>
                Enumeration {{ child.enum_name }}
              </caption>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Numeric</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="entry in enumValues(child)" :key="entry.symbol">
                  <td>{{ entry.symbol }}</td>
                  <td>{{ entry.numeric ?? entry.value ?? '' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </template>
    <p v-else class="c-command-detail__unknown" role="alert">
      Unknown command: {{ stem }}. The stem is not in the dataset command dictionary.
    </p>
  </div>
</template>

<script>
import datasetCache from 'services/dataset/DatasetCache.js';

const COMMAND_TYPE_LABELS = {
  fsw_command: 'Flight software command',
  hw_command: 'Hardware command'
};

export default {
  inject: ['openmct', 'domainObject'],
  computed: {
    definition() {
      return this.domainObject.definition || null;
    },
    isMissing() {
      return !this.definition || this.definition.status === 'missing';
    },
    stem() {
      return this.definition?.stem ?? this.domainObject.name;
    },
    typeLabel() {
      return COMMAND_TYPE_LABELS[this.definition?.type] ?? this.definition?.type ?? '';
    },
    allArguments() {
      return this.definition?.arguments || [];
    },
    enumMap() {
      const keyString = this.datasetKeyString();

      if (!keyString) {
        return {};
      }

      return datasetCache().datasets[keyString]?.commands?.dictionary?.enumMap ?? {};
    }
  },
  methods: {
    datasetKeyString() {
      const key = this.domainObject.identifier?.key || '';
      const parts = key.replace(/^command:/, '').split(':');

      if (parts.length < 2) {
        return null;
      }

      return `${parts[0]}:${parts[1]}`;
    },
    argumentType(argument) {
      return (argument?.arg_type || '').toLowerCase();
    },
    isFill(argument) {
      return this.argumentType(argument) === 'fill';
    },
    isBoolean(argument) {
      return this.argumentType(argument) === 'boolean';
    },
    isRepeat(argument) {
      return this.argumentType(argument) === 'repeat';
    },
    isRequired(argument) {
      return argument.default_value === undefined || argument.default_value === null;
    },
    argumentTypeLabel(argument) {
      const type = this.argumentType(argument);

      if (type === 'numeric' && argument.type) {
        return `numeric (${String(argument.type).toLowerCase()})`;
      }

      return type || 'unknown';
    },
    formatRange(argument) {
      const range = argument.range || null;

      if (!range) {
        return '';
      }

      const min = range.min ?? '...';
      const max = range.max ?? '...';

      return `${min} to ${max}`;
    },
    booleanForms(argument) {
      const format = argument.format || {};

      return [
        format.true_str !== undefined && format.true_str !== null ? format.true_str : 'TRUE',
        format.false_str !== undefined && format.false_str !== null ? format.false_str : 'FALSE'
      ];
    },
    enumValues(argument) {
      if (!argument.enum_name) {
        return [];
      }

      return this.enumMap[argument.enum_name]?.values || [];
    },
    repeatChildren(argument) {
      return (argument?.repeat?.arguments || []).filter((child) => !this.isFill(child));
    },
    repeatRange(argument) {
      const min = argument?.repeat?.min;
      const max = argument?.repeat?.max;
      const minText = Number.isInteger(min) ? min : 0;

      return Number.isInteger(max) ? `${minText} to ${max}` : `at least ${minText}`;
    }
  }
};
</script>

<style scoped>
.c-command-detail {
  padding: 12px;
  overflow-y: auto;
  height: 100%;
}
.c-command-detail__meta {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2px 12px;
  margin: 8px 0;
}
.c-command-detail__meta dt {
  font-weight: bold;
}
.c-command-detail__meta dd {
  margin: 0;
}
.c-command-detail__argument {
  margin: 12px 0;
  padding: 8px 12px;
  border: 1px solid;
}
.c-command-detail__type {
  font-weight: normal;
}
.c-command-detail__flag {
  font-weight: normal;
  font-style: italic;
}
.c-command-detail__enum-table {
  border-collapse: collapse;
  margin: 8px 0;
}
.c-command-detail__enum-table caption {
  text-align: left;
  font-weight: bold;
}
.c-command-detail__enum-table th,
.c-command-detail__enum-table td {
  padding: 2px 12px 2px 0;
  text-align: left;
}
.c-command-detail__repeat-child {
  margin: 8px 0 8px 16px;
}
</style>
