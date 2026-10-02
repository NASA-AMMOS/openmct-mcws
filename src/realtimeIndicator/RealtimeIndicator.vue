<template>
  <div class="h-indicator">
    <div class="c-indicator icon-clock" :class="cssClass">
      <span class="label c-indicator__label">{{ currentValue.text }}</span>
    </div>
  </div>
</template>

<script>
import getGlobalStaleness from 'services/globalStaleness/globalStaleness.js';

const POLL_INTERVAL_MS = 1000;

export default {
  inject: ['openmct', 'format'],
  data() {
    return {
      currentValue: {
        text: 'Last real-time display update: never',
        cssClass: ''
      }
    };
  },
  computed: {
    cssClass() {
      let className = this.currentValue['cssClass'];
      let classObject = {};
      classObject[className] = className.length > 0;
      return classObject;
    }
  },
  mounted() {
    this.previousTimestamp = 0;
    this.refresh();
    this.pollInterval = setInterval(this.refresh.bind(this), POLL_INTERVAL_MS);
  },
  beforeUnmount() {
    clearInterval(this.pollInterval);
  },
  methods: {
    isRefreshRateNominal(newTimestamp, lastTimestamp) {
      if (newTimestamp - lastTimestamp <= 100) {
        return true;
      }
      return false;
    },
    refresh() {
      const latestTimestamp = getGlobalStaleness()?.latestTimestamp ?? 0;

      if (!latestTimestamp || latestTimestamp === this.previousTimestamp) {
        return;
      }

      try {
        if (this.isRefreshRateNominal(latestTimestamp, this.previousTimestamp)) {
          this.currentValue = {
            text: 'Data Rate is higher than 10hz, display may update less than once per second',
            cssClass: 's-status-caution'
          };
        } else {
          let formattedTimestamp = this.format.format(new Date(latestTimestamp));

          this.currentValue = {
            text: 'Last real-time display update: ' + formattedTimestamp,
            cssClass: 's-status-on'
          };
        }
        this.previousTimestamp = latestTimestamp;
      } catch (e) {
        console.warn('Error refreshing realtime indicator', e);
      }
    }
  }
};
</script>
