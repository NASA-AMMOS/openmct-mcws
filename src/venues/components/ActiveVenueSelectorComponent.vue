<template>
  <div class="l-venue-section l-active-venue-selector" :class="{ loading: loading }">
    <div v-for="venue in venues" :key="venue.id" class="venue-item">
      <!-- Assuming 'vista-venue' is a Vue component that you will use to render each venue. -->
      <!-- You will need to create or adapt a Vue component for 'vista.venue' equivalent. -->
      <vista-venue :venue="venue" :is-selected="isSelected(venue)" @select-venue="selectVenue(venue)"></vista-venue>
    </div>
  </div>
</template>

<script>
export default {
  props: ['parameters'],
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
    loadVenues() {
      this.loading = true;
      // Assuming `venueService` is an imported service with a method `listVenues` that returns a Promise.
      // You will need to adapt this part to your project's structure.
      venueService.listVenues()
        .then(venues => {
          this.venues = venues;
        })
        .catch(error => {
          console.error('error loading venues', error);
        })
        .finally(() => {
          this.loading = false;
        });
    },
    isSelected(venue) {
      // Assuming `parameters.isSelected` is a method passed as a prop that determines if a venue is selected.
      return this.parameters.isSelected(venue);
    },
    selectVenue(venue) {
      // Assuming `parameters.selectVenue` is a method passed as a prop for selecting a venue.
      this.parameters.selectVenue(venue);
    }
  },
};
</script>

<style scoped>
/* Add your component-specific styles here */
</style>