<template>
  <div
    class="c-venue-button c-button"
    :class="{
      loading: isLoading,
      'is-selected': isSelected,
      'is-active': isActive
    }"
    :disabled="!isActive"
    @click="selectVenue(venue)"
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
  emits: ['venue-selected'],
  data() {
    return {
      name: '',
      isActive: false,
      isLoading: false
    };
  },
  async created() {
    this.name = this.venue.domainObject.name;

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
