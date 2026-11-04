<template>
  <div
    ref="snapHolder"
    class="c-snap-tc c-compact-tc is-fixed-mode is-expanded"
    :class="{ 'c-snap-tc--disabled': isDisabled }"
    :title="hoverText"
    :aria-disabled="isDisabled"
    @click.capture="interceptClickWhenDisabled"
  >
    <!-- c-compact-tc is-fixed-mode is-expanded mirrors core's conductor holder
         so the readout and popup inherit core's fixed-mode bar and popup
         colors ($colorTimeFixedBg) instead of generic menu colors. Fixed-only
         by design; no other core rules match these classes on this subtree.
         NOTE: this comment must live INSIDE the root div. A leading template
         comment makes the component fragment-rooted, in which case $el is
         the comment node and handleClickAway's contains() check always fails
         (every document click would close the popup). -->
    <ToggleSwitch
      id="sessionSnapTCToggle"
      class="c-toggle-switch--mini"
      :checked="snapEnabled"
      :name="hoverText"
      @change="onToggle"
    />
    <ConductorModeIcon />
    <!-- Plain-element click target: @click attached directly to the fixed
         inputs (a fragment-root component) demonstrably misses trusted mouse
         clicks, so the readout gets a real wrapper div. -->
    <div
      v-if="snapEnabled"
      class="c-snap-tc__readout c-compact-tc__bounds--fixed"
      tabindex="0"
      @click="openPopup"
      @keydown.enter="openPopup"
      @keydown.space.prevent="openPopup"
    >
      <ConductorInputsFixed :read-only="true" :compact="true" />
    </div>
    <div
      v-if="popupOpen"
      ref="popup"
      class="c-tc-input-popup c-tc-input-popup--fixed-mode c-snap-tc__popup"
    >
      <ConductorInputsFixed @dismiss-inputs-fixed="closePopup" />
    </div>
  </div>
</template>

<script>
import ToggleSwitch from 'openmct.ui.ToggleSwitch';
import ConductorModeIcon from 'openmct.timeConductor.ConductorModeIcon';
import ConductorInputsFixed from 'openmct.timeConductor.ConductorInputsFixed';
import { inject, nextTick, onBeforeUnmount, provide, reactive } from 'vue';
import {
  computeSessionSnapRange,
  getSessionTimeFields,
  widenEqualBounds
} from './sessionSnapBounds.js';

const SNAP_TITLE = 'Snap Time Conductor';
const REALTIME_UNAVAILABLE_TITLE = 'Not available in realtime';
const SNAP_CONTEXT_KEY = 'session-snap-time-conductor';

function safeGetFormatter(openmct, key) {
  try {
    return openmct.telemetry.getFormatter(key);
  } catch {
    return undefined;
  }
}

export default {
  components: {
    ToggleSwitch,
    ConductorModeIcon,
    ConductorInputsFixed
  },
  inject: ['openmct'],
  props: {
    sessions: {
      type: Array,
      required: true
    }
  },
  setup() {
    // The fixed inputs below are core's conductor form; they need a time
    // context plus the usual conductor provides. The context is a real
    // independent context under a synthetic key (no domain object, nothing
    // persisted); it follows the global conductor until the toggle gives it
    // its own fixed bounds, mirroring core ITC teardown on disable/unmount.
    const openmct = inject('openmct');
    const timeSystem = openmct.time.getTimeSystem();
    const snapTimeContext = openmct.time.getContextForView([
      { identifier: { namespace: '', key: SNAP_CONTEXT_KEY } }
    ]);
    const snapBounds = reactive({ start: 0, end: 0 });
    const syncSnapBounds = () => {
      const bounds = snapTimeContext.getBounds();

      snapBounds.start = bounds.start;
      snapBounds.end = bounds.end;
    };

    snapTimeContext.on('bounds', syncSnapBounds);
    onBeforeUnmount(() => {
      snapTimeContext.off('bounds', syncSnapBounds);
    });

    provide('timeContext', snapTimeContext);
    provide('bounds', snapBounds);
    provide('timeSystemKey', timeSystem.key);
    provide('timeSystemFormatter', safeGetFormatter(openmct, timeSystem.timeFormat));
    provide('timeSystemDurationFormatter', safeGetFormatter(openmct, timeSystem.durationFormat));
    provide('isTimeSystemUTCBased', timeSystem.isUTCBased);
    provide('configuration', { menuOptions: [] });

    return { snapTimeContext, snapBounds, syncSnapBounds };
  },
  data() {
    return {
      snapEnabled: false,
      popupOpen: false,
      isFixedMode: true,
      timeSystemKey: '',
      timeSystemName: '',
      snapAvailable: false,
      destroySnapContext: null
    };
  },
  computed: {
    isDisabled() {
      return !this.isReady;
    },
    isReady() {
      return this.isFixedMode && this.sessions.length > 0 && this.snapAvailable;
    },
    hoverText() {
      if (!this.isFixedMode) {
        return REALTIME_UNAVAILABLE_TITLE;
      }

      if (this.sessions.length === 0 || this.snapAvailable) {
        return SNAP_TITLE;
      }

      return `Snap Time Unavailable in ${this.timeSystemName}`;
    }
  },
  watch: {
    sessions() {
      this.refreshAvailability();
      if (!this.isReady) {
        this.disableSnap();
      }
    }
  },
  mounted() {
    this.refreshAvailability();
    this.openmct.time.on('modeChanged', this.handleModeChanged);
  },
  beforeUnmount() {
    this.openmct.time.off('modeChanged', this.handleModeChanged);
    document.removeEventListener('click', this.handleClickAway);
    this.destroyContext();
  },
  methods: {
    getFormatter() {
      const timeSystem = this.openmct.time.getTimeSystem();

      return safeGetFormatter(this.openmct, timeSystem.timeFormat);
    },
    computeRange() {
      const formatter = this.getFormatter();

      if (!formatter) {
        return { available: false };
      }

      const [startField, endField] = getSessionTimeFields(this.timeSystemKey);
      const parse = (value) => formatter.parse(value);

      return computeSessionSnapRange(this.sessions, startField, endField, parse);
    },
    refreshAvailability() {
      const timeSystem = this.openmct.time.getTimeSystem();

      this.isFixedMode = this.openmct.time.isFixed();
      this.timeSystemKey = timeSystem.key;
      this.timeSystemName = timeSystem.key.toUpperCase();
      this.snapAvailable = this.sessions.length > 0 && this.computeRange().available;
    },
    handleModeChanged() {
      if (!this.openmct.time.isFixed()) {
        this.disableSnap();
      }

      this.refreshAvailability();
    },
    interceptClickWhenDisabled(event) {
      if (this.isDisabled) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    onToggle(checked) {
      if (this.isDisabled) {
        return;
      }

      if (checked) {
        this.enableSnap();
      } else {
        this.disableSnap();
      }
    },
    enableSnap() {
      const range = this.computeRange();

      if (!range.available) {
        this.refreshAvailability();
        // Re-sync the controlled checkbox; the click already toggled it natively.
        this.$forceUpdate();

        return;
      }

      const widened = widenEqualBounds(range.start, range.end, this.getFormatter());
      const keyString = this.openmct.objects.makeKeyString({
        namespace: '',
        key: SNAP_CONTEXT_KEY
      });

      this.destroySnapContext = this.openmct.time.addIndependentContext(keyString, widened);
      this.syncSnapBounds();
      this.snapEnabled = true;
      this.openPopup();
    },
    disableSnap() {
      this.snapEnabled = false;
      this.closePopup();
      this.destroyContext();
    },
    destroyContext() {
      if (this.destroySnapContext) {
        this.destroySnapContext();
        this.destroySnapContext = null;
      }
    },
    getSnapBounds() {
      if (!this.snapEnabled || !this.destroySnapContext) {
        return undefined;
      }

      const bounds = this.snapTimeContext.getBounds();

      return { start: bounds.start, end: bounds.end };
    },
    openPopup() {
      this.popupOpen = true;
      nextTick(() => {
        document.addEventListener('click', this.handleClickAway);
      });
    },
    closePopup() {
      this.popupOpen = false;
      document.removeEventListener('click', this.handleClickAway);
    },
    handleClickAway(event) {
      // The holder ref (not $el) is the containment root: it stays correct
      // even if the template ever regains a fragment root.
      if (!this.$refs.snapHolder.contains(event.target)) {
        this.closePopup();
      }
    }
  }
};
</script>

<style lang="scss">
// Doubled class wins over core's single-class .c-compact-tc layout rules so
// the button-bar item keeps its own flex geometry.
.c-snap-tc.c-compact-tc {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  align-self: center;
  position: relative;

  // Namespaced (not core's global .disabled, which would also kill hover).
  // The holder itself must stay hoverable so the title tooltip shows; clicks
  // are already stopped by interceptClickWhenDisabled. Core themes force
  // pointer-events:none !important via [aria-disabled="true"], so this needs
  // equal importance at higher specificity to win it back.
  &.c-snap-tc--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: auto !important;
  }

  &.c-snap-tc--disabled > * {
    pointer-events: none;
  }

  > .c-snap-tc__readout {
    display: flex;
    align-items: center;
    margin-left: 5px;
    cursor: pointer;
  }
}

.c-snap-tc__popup {
  z-index: 1;

  // Single action: the checkmark accepts edits. Abandoning the snap is the
  // toggle's job (and click-away keeps standard menu behavior); an X here
  // falsely implies the snap itself can be rejected.
  [aria-label='Discard changes and close time popup'] {
    display: none;
  }
}
</style>
