<template>
  <div class="u-contents">
    <div class="c-overlay__top-bar">
      <div class="c-overlay__dialog-title">Mission Control Sessions</div>
    </div>
    <div class="c-overlay__dialog-hint">
      <span>
        Start and stop uplink and downlink sessions, and choose the uplink session that command
        plugins target.
      </span>
    </div>

    <div class="c-overlay__contents-main c-session-control__dialog-contents">
      <SessionControl />
    </div>

    <div class="c-overlay__button-bar">
      <button class="c-button c-button--major" @click="closeOverlay()">Done</button>
    </div>
  </div>
</template>

<script>
import SessionControl from './SessionControl.vue';

export default {
  components: {
    SessionControl
  },
  inject: ['openmct'],
  emits: ['close-session-control-dialog'],
  mounted() {
    this.openOverlay();
  },
  methods: {
    openOverlay() {
      this.overlay = this.openmct.overlays.overlay({
        element: this.$el,
        size: 'large',
        dismissible: true,
        onDestroy: () => {
          this.$emit('close-session-control-dialog');
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

<style scoped>
.c-session-control__dialog-contents {
  display: flex;
  min-height: 0;
  overflow-y: auto;
}
.c-session-control__dialog-contents > .c-session-control {
  flex: 1;
  min-height: 0;
}
</style>
