<template>
  <div class="h-indicator">
    <div
      class="c-indicator icon-session"
      :class="{
        's-status-on': isConfigured,
        's-status-available': isAvailable
      }"
    >
      <span class="c-indicator__label">
        <span v-if="isLoading">MCS Loading...</span>
        <span v-else-if="isConfigured">
          MCS Configured (session {{ selectedSessionId }})
          <button @click="openDialog()">Configure</button>
        </span>
        <span v-else-if="isAvailable">
          MCS Available
          <button @click="openDialog()">Configure</button>
        </span>
        <span v-else>
          MCS Not Configured
          <button @click="openDialog()">Configure</button>
        </span>
      </span>
    </div>

    <SessionControlDialog v-if="showDialog" @close-session-control-dialog="closeDialog" />
  </div>
</template>

<script>
import SessionControlDialog from './SessionControlDialog.vue';

export default {
  components: {
    SessionControlDialog
  },
  inject: ['openmct', 'missionControlService'],
  data() {
    return {
      isLoading: true,
      showDialog: false
    };
  },
  computed: {
    isConfigured() {
      return !this.isLoading && this.missionControlService.canSendCommands();
    },
    isAvailable() {
      return (
        !this.isLoading &&
        !this.isConfigured &&
        this.missionControlService.state.uplinkSessions.length > 0
      );
    },
    selectedSessionId() {
      return this.missionControlService.selectedUplinkSessionId;
    }
  },
  mounted() {
    this.missionControlService
      .refreshTrackingSessions()
      .catch(() => {})
      .then(() => this.missionControlService.refreshUplinkSessions().catch(() => {}))
      .then(() => this.missionControlService.refreshDownlinkSessions().catch(() => {}))
      .finally(() => {
        this.isLoading = false;
      });
  },
  methods: {
    openDialog() {
      this.showDialog = true;
    },
    closeDialog() {
      this.showDialog = false;
    }
  }
};
</script>
