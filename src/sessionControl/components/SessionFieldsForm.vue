<template>
  <form class="c-session-fields" @submit.prevent="submit">
    <p v-if="fields.length === 0" class="c-session-fields__empty">{{ emptyText }}</p>
    <div v-for="field in fields" :key="field.key" class="c-form__row c-session-fields__row">
      <label :for="inputId(field)">
        {{ field.name }}
        <span v-if="field.required">(required)</span>
      </label>
      <select
        v-if="field.control === 'select'"
        :id="inputId(field)"
        v-model="values[field.key]"
        :disabled="isLocked(field)"
        @change="reassign"
      >
        <option v-for="option in field.options" :key="String(option.value)" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <input
        v-else
        :id="inputId(field)"
        v-model="values[field.key]"
        :type="field.control === 'number' ? 'number' : 'text'"
        :min="field.min ?? undefined"
        :max="field.max ?? undefined"
        :readonly="isLocked(field)"
        @input="clearError(field)"
      />
      <span v-if="field.description" class="c-session-fields__hint">
        {{ field.description }}
      </span>
      <span v-if="errors[field.key]" class="c-session-fields__error" role="alert">
        {{ errors[field.key] }}
      </span>
    </div>
    <button type="submit" class="c-button c-button--major" :disabled="busy">
      {{ submitLabel }}
    </button>
  </form>
</template>

<script>
import {
  applyLocks,
  assignFreeValues,
  initialValues,
  lockedValues,
  toParameters,
  validateSessionValues
} from '../../missionControl/sessionFields.js';

export default {
  props: {
    fields: {
      type: Array,
      required: true
    },
    activeSessions: {
      type: Array,
      default: () => []
    },
    busy: {
      type: Boolean,
      default: false
    },
    idPrefix: {
      type: String,
      required: true
    },
    submitLabel: {
      type: String,
      default: 'Open'
    },
    emptyText: {
      type: String,
      default: 'No fields are configured; the proxy defaults apply.'
    }
  },
  emits: ['submit'],
  data() {
    return {
      values: initialValues(this.fields, this.activeSessions),
      errors: {}
    };
  },
  computed: {
    locks() {
      return lockedValues(this.fields, this.values);
    }
  },
  watch: {
    activeSessions: {
      handler() {
        this.reassign();
      },
      deep: true
    }
  },
  methods: {
    inputId(field) {
      return `${this.idPrefix}-${field.key}`;
    },
    isLocked(field) {
      return field.key in this.locks;
    },
    reassign() {
      this.values = assignFreeValues(this.fields, this.values, this.activeSessions);
      this.errors = {};
    },
    clearError(field) {
      if (this.errors[field.key]) {
        const rest = { ...this.errors };

        delete rest[field.key];
        this.errors = rest;
      }
    },
    submit() {
      const values = applyLocks(this.fields, this.values);
      const { valid, errors } = validateSessionValues(this.fields, values, this.activeSessions);

      this.errors = errors;

      if (!valid) {
        return;
      }

      this.$emit('submit', toParameters(this.fields, values));
    }
  }
};
</script>

<style scoped>
.c-session-fields__row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  align-items: baseline;
}

.c-session-fields__hint {
  opacity: 0.7;
  font-size: 0.9em;
}

.c-session-fields__error {
  font-weight: bold;
}
</style>
