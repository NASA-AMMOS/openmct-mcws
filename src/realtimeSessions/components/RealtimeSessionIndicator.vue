<template>
<div class="h-indicator">
    <div
        class="c-indicator icon-topic"
        :class="{
            's-status-on': hasActiveSession,
            's-status-available': hasTopics && !hasActiveSession
        }"
    >
        <span
            v-if="realtimeSessionDisabled"
            class="c-indicator__label"
        >Real-time Disabled in Config</span>

        <span
            v-else
            class="c-indicator__label"
        >
            <span
                v-if="hasActiveSession"
            >
                Connected to
                {{ activeSession.topic }}
                {{ activeSession.number }}
                <button @click="openSessionSelector()">Change</button>
                <button @click="disconnect()">Disconnect</button>
            </span>
            <span
                v-if="hasTopics && !hasActiveSession"
            >
                Real-time Available
                <button @click="openSessionSelector()">
                    Select
                </button>
            </span>
            <span
                v-if="!hasTopics && !hasActiveSession"
            >
                Real-time Not Available
            </span>
        </span>
    </div>

    <RealtimeSessionSelector
        v-if="showSessionSelector"
        @close-session-selector="closeSessionSelector"
    />
</div>
</template>

<script>
import RealtimeSessionSelector from './RealtimeSessionSelector.vue';
import SessionService from 'services/session/SessionService';

export default {
    components: {
        RealtimeSessionSelector
    },
    inject: [
        'openmct'
    ],
    data() {
        return {
            hasTopics: undefined,
            activeSession: undefined,
            showSessionSelector: false,
            realtimeSessionDisabled: undefined
        }
    },
    mounted() {
        this.sessionService = SessionService();
        this.realtimeSessionDisabled = this.sessionService.realtimeSessionConfig.disable;
        this.activeSession = this.sessionService.getActiveTopicOrSession();
        this.stopListening = this.sessionService.listen(this.onActiveSessionChange);

        this.pollForSessions();
    },
    beforeDestroy() {
        this.stopListening?.();
    },
    computed: {
        hasActiveSession() {
            return this.activeSession !== undefined;
        }
    },
    methods: {
        pollForSessions() {
            if (!this.activeSession) {
                this.sessionService
                    .getTopicsWithSessions()
                    .then(topics => {
                        this.hasTopics = topics.length > 0;
                    });
            }

            if (this.activeTimeout) {
                clearTimeout(this.activeTimeout);
            }

            this.activeTimeout =
                setTimeout(() => {
                    this.pollForSessions();
                }, 15000);
        },
        disconnect() {
            this.sessionService.setActiveTopicOrSession(undefined);
        },
        onActiveSessionChange(session) {
            this.activeSession = session;
            this.pollForSessions();
        },
        openSessionSelector() {
            this.showSessionSelector = true;
        },
        closeSessionSelector() {
            this.showSessionSelector = false;
        },
    }
}
</script>