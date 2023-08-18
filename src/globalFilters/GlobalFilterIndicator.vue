<template>
  <div class="h-indicator">
    <div
      class="c-indicator icon-filter"
      :class="{
        's-status-on': hasActiveFilters,
        's-status-available': hasFilters
      }"
    >
      <span class="c-indicator__label">
        <span v-if="hasActiveFilters">
          Filtering by 
          <span v-if="hasMultipleActiveFilters">
            {{ `(` }}
          </span>
          <span
            v-for="(activeFilter, key, index) in activeFilters"
            :key="key"
          >
            <span v-if="hasMultipleActiveFilters && index !== 0">
              {{ `/` }}
            </span>
            {{ getFilterName(key) }}
          </span>
          <span v-if="hasMultipleActiveFilters">
            {{ `)` }}
          </span>
          <button @click="openFilterSelector()">Change</button>
          <button @click="clearFilters()">Clear</button>
        </span>
        <span v-else-if="hasFilters">
          Not Filtering
          <button @click="openFilterSelector()">
            Select
          </button>
        </span>
        <span v-else>
          Filters Not Configured
        </span>
      </span>
    </div>

    <GlobalFilterSelector
      v-if="showFilterSelector"
      :active-filters="activeFilters"
      @update-filters="updateFilters"
      @close-filter-selector="closeFilterSelector"
    />
  </div>
</template>

<script>
import filterService from 'services/filtering/FilterService';
import GlobalFilterSelector from './GlobalFilterSelector.vue';

export default {
  components: {
    GlobalFilterSelector
  },
  inject: [
    'openmct',
    'filters'
  ],
  data() {
    return {
      activeFilters: {},
      showFilterSelector: false
    }
  },
  mounted() {
    this.filterService = filterService(this.openmct, this.filters);
    this.filterService.on('update', this.updateActiveFilters);

    this.updateActiveFilters();
  },
  computed: {
    hasFilters() {
      return this.filters?.length;
    },
    hasActiveFilters() {
      return Object.keys(this.activeFilters)?.length;
    },
    hasMultipleActiveFilters() {
      return Object.keys(this.activeFilters)?.length > 1;
    }
  },
  methods: {
    updateFilters(filters) {
      this.filterService.updateFilters(filters);
    },
    clearFilters() {
      this.filterService.clearFilters();
    },
    updateActiveFilters() {
      this.activeFilters = this.filterService.getActiveFilters();
    },
    getFilterName(key) {
      const match = this.filters.find(filter => filter.key === key);

      return match.name;
    },
    openFilterSelector() {
      this.showFilterSelector = true;
    },
    closeFilterSelector() {
      this.showFilterSelector = false;
    },
  }
}
</script>