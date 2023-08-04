<template>
  <div class="h-indicator">
    <div
      class="c-indicator icon-flag"
      :class="{
        's-status-on': hasActiveFilter,
        's-status-available': hasFilters
      }"
    >
      <span class="c-indicator__label">
        <span v-if="hasActiveFilter">
          {{ activeFilter.name }}
          <button @click="openFilterSelector()">Change</button>
          <button @click="clearFilter()">Clear</button>
        </span>
        <span v-else-if="hasFilters">
          Filter VCID group
          <button @click="openFilterSelector()">
            Select
          </button>
        </span>
        <span v-else>
          Filters Not Configured
        </span>
      </span>
    </div>
<!-- 
    <VirtualChannelGlobalFilterSelector
      v-if="showFilterSelector"
      @set-filter="setActiveFilter"
      @close-filter-selector="closeFilterSelector"
    /> -->
  </div>
</template>

<script>
import VirtualChannelGlobalFilterSelector from './VirtualChannelGlobalFilterSelector.vue';

export default {
  components: {
    VirtualChannelGlobalFilterSelector
  },
  inject: [
    'openmct'
  ],
  data() {
    return {
      hasFilters: undefined,
      activeFilter: undefined,
      showFilterSelector: false
    }
  },
  mounted() {
    this.activeFilter = this.getActiveFilter();
  },
  computed: {
    hasActiveFilter() {
      return this.activeFilter !== undefined;
    }
  },
  methods: {
    clearFilter() {
      this.activeFilter = undefined;
    },
    getActiveFilter() {
      // TODO get from url
      return this.activeFilter;
    },
    setActiveFilter(filter) {
      this.activeFilter = filter;
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