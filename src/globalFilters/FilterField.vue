<template>
  <div class="c-inspect-properties__section c-filter-settings">
    <div class="c-inspect-properties__label label">
      {{ name }} =
    </div>
      <div class="c-inspect-properties__value value">
        <!-- Dropdown -->
        <template v-if="filter.possibleValues && filter.singleSelectionThreshold">
          <select
            name="setSelectionThreshold"
            @change="updateFilterValueFromDropdown($event, filter.comparator, $event.target.value)"
          >
            <option key="NONE" value="NONE" selected="isSelected(filter.comparator, option.value)">
              None
            </option>
            <option
              v-for="option in filter.possibleValues"
              :key="option.label"
              :value="option.value"
              :selected="isSelected(filter.comparator, option.value)"
            >
              {{ option.label }}
            </option>
          </select>
        </template>
      </div>
  </div>
</template>

<script>
export default {
  inject: ['openmct'],
  props: {
    filter: {
      type: Object,
      required: true
    },
    filterKey: {
      type: String,
      required: true
    },
    filterName: {
      type: String,
      default: ''
    },
    persistedFilter: {
      type: Object,
      default: () => {
        return {};
      }
    }
  },
  computed: {
    name() {
      return this.filterName || this.filterKey;
    }
  },
  data() {
    return {
    };
  },
  mounted() {
  },
  beforeUnmount() {
  },
  methods: {
    isSelected(comparator, value) {
      return Boolean(this.persistedFilter[comparator]?.includes(value));
    },
    updateFilterValueFromDropdown(event, comparator, value) {
      if (value === 'NONE') {
        this.$emit('clear-filter', this.filterKey);
      } else {
        this.$emit('filter-single-selected', this.filterKey, comparator, value);
      }
    }
  }
};
</script>
