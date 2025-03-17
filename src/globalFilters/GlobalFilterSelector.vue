<template>
  <div class="u-contents">
    <div class="c-overlay__top-bar">
      <div class="c-overlay__dialog-title">Apply Global Filters</div>
    </div>
    <div class="c-overlay__dialog-hint">
      <span
        >Apply Global Filters to all views. Will force re-query. Persisted filters on objects will
        override global filters.</span
      >
    </div>

    <ul class="c-inspect-properties">
      <div class="c-inspect-properties__section c-filter-settings">
        <FilterField
          v-for="filter in filters"
          :key="filter.key"
          :filter-key="filter.key"
          :filter-name="filter.name"
          :filter="filter.filter"
          :persisted-filter="updatedFilters[filter.key]"
          @clear-filter="clearFilter"
          @filter-single-selected="updateSingleSelection"
        />
      </div>
    </ul>
    <div class="c-overlay__button-bar">
      <button
        :class="{ disabled: !hasFiltersChanged }"
        class="c-button c-button--major"
        @click="updateFilters()"
      >
        Update Filters
      </button>
      <button class="c-button" @click="cancel()">Cancel</button>
    </div>
  </div>
</template>

<script>
import FilterField from './FilterField.vue';
import { toRaw } from 'vue';

export default {
  components: {
    FilterField
  },
  inject: ['openmct', 'filters'],
  props: {
    activeFilters: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      updatedFilters: {},
      hasFiltersChanged: true
    };
  },
  watch: {
    updatedFilters: {
      handler() {
        console.log('TODO: detect if changes to disable update button');
      },
      deep: true
    }
  },
  mounted() {
    this.updatedFilters = structuredClone(toRaw(this.activeFilters));
    this.openOverlay();
  },
  methods: {
    clearFilter(key) {
      this.updatedFilters[key] = {};
    },
    updateSingleSelection(key, comparator, value) {
      if (!this.updatedFilters[key]) {
        this.clearFilter(key);
      }

      this.updatedFilters[key][comparator] = value;
    },
    updateFilters() {
      this.$emit('update-filters', toRaw(this.updatedFilters));

      this.closeOverlay();
    },
    cancel() {
      this.closeOverlay();
    },
    openOverlay() {
      this.overlay = this.openmct.overlays.overlay({
        element: this.$el,
        size: 'fit',
        dismissable: true,
        onDestroy: () => {
          this.$emit('close-filter-selector');
        }
      });
    },
    closeOverlay() {
      if (this.overlay) {
        this.overlay.dismiss();
        delete this.overlay;
      }
    }
  }
};
</script>
