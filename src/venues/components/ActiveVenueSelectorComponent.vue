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
import venueService from '../venueService';
import VenueComponent from './VenueComponent';

export default {
  props: ['venue'],
  components: {
    VenueComponent
  },
  data() {
    return {
      venues: [],
      loading: true,
    };
  },
  created() {
    this.loadVenues();
  },
  methods: {
    async loadVenues() {
      this.loading = true;

      try {
        const venues = await venueService.listVenues();
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
      this.$emit('venueSelected', venue);
    }
  },
};
</script>
