<template>
  <div
    class="c-venue-button c-button"
    :class="{
      loading: isLoading,
      'is-selected': isSelected,
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
  props: {
    venue: {
      type: Object,
      required: true
    },
    isSelected: {
      type: Boolean,
      required: true
    }
  },
  data() {
    return {
      name: '',
      isActive: false,
      isLoading: false,
    };
  },
  async created() {
    this.name = this.venue.model.name;
    
    if (this.venue.allowsRealtime()) {
      this.isLoading = true;

      try {
        const activeSessions = await this.venue.getActiveSessions();

        if (activeSessions.length) {
          this.isActive = true;
        }
      } catch (error) {
        console.error('Error loading active sessions for Venue', this.venue, error);
      } finally {
        this.isLoading = false;
      }
    }
  },
  methods: {
    selectVenue(venue) {
      this.$emit('venue-selected', venue);
    }
  }
};
</script>
