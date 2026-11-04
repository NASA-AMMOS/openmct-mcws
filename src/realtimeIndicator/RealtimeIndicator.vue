<template>
  <div class="h-indicator">
    <div class="c-indicator icon-clock" :class="cssClass">
      <span class="label c-indicator__label">{{ currentValue.text }}</span>
    </div>
  </div>
</template>

<script>
export default {
  inject: ['openmct', 'vistaTime', 'format'],
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
    this.lastPaint = 0;
    this.ticksSincePaint = 0;

    if (this.vistaTime.ladClocks.ert) {
      this.tickHandler = this.setTick.bind(this);
      this.vistaTime.ladClocks.ert.on('tick', this.tickHandler);
    }
  },
  beforeUnmount() {
    if (this.vistaTime.ladClocks.ert && this.tickHandler) {
      this.vistaTime.ladClocks.ert.off('tick', this.tickHandler);
    }
  },
  methods: {
    setTick() {
      try {
        const now = Date.now();

        this.ticksSincePaint += 1;

        // Ticks can arrive hundreds of times per second; repaint at most
        // once per second and report the arrival rate instead of each tick.
        if (now - this.lastPaint < 1000) {
          return;
        }

        const elapsedSeconds = (now - this.lastPaint) / 1000;
        const ticksPerSecond = this.ticksSincePaint / elapsedSeconds;

        this.ticksSincePaint = 0;
        this.lastPaint = now;

        if (ticksPerSecond > 10) {
          this.currentValue = {
            text: 'Data Rate is higher than 10hz, display may update less than once per second',
            cssClass: 's-status-caution'
          };
        } else {
          let formattedTimestamp = this.format.format(new Date());

          this.currentValue = {
            text: 'Last real-time display update: ' + formattedTimestamp,
            cssClass: 's-status-on'
          };
        }
      } catch (e) {
        console.warn('Error setting tick', e);
      }
    }
  }
};
</script>
