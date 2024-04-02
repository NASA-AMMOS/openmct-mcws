<template>
  <div
    class="c-venue-button c-button"
    :class="{
      loading: isLoading,
      'is-selected': isSelected(venue),
      'is-active': isActive
    }"
    @click="selectVenue(venue)"
    :disabled="!isActive"
  >
    <span class="c-venue-button__label">{{ name }}</span>
  </div>
</template>

<script>
export default {
  props: ['parameters'],
  data() {
    return {
      venue: this.parameters.venue,
      isSelected: this.parameters.isSelected,
      selectVenue: this.parameters.selectVenue,
      name: '',
      isActive: false,
      isLoading: false,
    };
  },
  created() {
    this.name = this.venue.model.name;
    
    if (this.venue.allowsRealtime()) {
      this.isLoading = true;
      this.venue.getActiveSessions()
        .then((activeSessions) => {
          if (activeSessions.length) {
            this.isActive = true;
          }
        })
        .catch((error) => {
          console.error('Error loading active sessions for Venue', this.venue);
        })
        .finally(() => {
          this.isLoading = false;
        });
    }
  },
};
</script>
