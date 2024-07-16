<template>
  <div class="l-venue-section l-active-venue-selector" :class="{ loading: loading }">
    <div
      v-for="venue in venues"
      :key="venue.id"
      class="venue-item"
    >
      <VenueComponent
        :venue="venue"
        :is-selected="isSelected(venue)"
        @venue-selected="selectVenue(venue)"
      ></VenueComponent>
    </div>
  </div>
</template>

<script>
import VenueComponent from './VenueComponent.vue';

export default {
  inject: ['venueService'],
  props: {
    venue: {
      type: Object,
      required: false,
      default: () => {
        return {};
      }
    }
  },
  components: {
    VenueComponent
  },
  data() {
    return {
      venues: [],
      loading: true,
    };
  },
  mounted() {
    this.loadVenues();
  },
  methods: {
    async loadVenues() {
      this.loading = true;

      try {
        const venues = await this.venueService.listVenues();

        this.venues = venues;
      } catch (error) {
        console.error('error loading venues', error);
      } finally {
        this.loading = false;
      }
    },
    isSelected(venue) {
      return this.venue === venue;
    },
    selectVenue(venue) {
      this.$emit('venue-selected', venue);
    }
  },
};
</script>
