<template>
    <div class="h-indicator">

        <div class="c-indicator icon-session"
            :class="{
                's-status-on': activeSessions.numbers,
                's-status-available': availableSessions.length
            }">

            <span 
                v-if="historicalSessionDisabled" 
                class="c-indicator__label"
            >
                <span class="angular-w">
                    Historical Session Filtering Disabled in Config
                </span>
            </span>

            <span
                v-else
                class="c-indicator__label"  
                style="display:flex; flex-direction:column;"
            >

                <template v-if="availableSessions.length">

                    <span v-if="activeSessions.numbers"
                        class="angular-w">
                        {{filteredByMessageString}}
                        <button @click="openSessionSelector">
                            Change
                        </button>
                        <button @click="clearAllSessions">
                            Clear
                        </button>
                    </span>

                    <span v-else
                        class="angular-w">
                        Filter by historical sessions
                        <button @click="openSessionSelector">
                            Select
                        </button>
                    </span>
                </template>

                <span v-else
                      class="angular-w">
                    No Historical Sessions Available
                    <button :class="{disabled: isRequestingSessions}"
                            @click="checkForHistoricalSessions">
                        {{isRequestingSessions ? 'Requesting...' : 'Request'}}
                    </button>
                </span>
            </span>
        </div>

        <historical-session-selector
            v-if="showSessionSelector"
            :activeSessions="activeSessions"
            @update-available-sessions="setAvailableSessions"
            @close-session-selector="closeSessionSelector"
        />
    </div>
</template>

<style>
</style>

<script>
import HistoricalSessionSelector from '../sessionSelector/historicalSessionSelector.vue';
import SessionService from 'services/session/SessionService';

export default {
    inject: [
        'openmct',
        'table'
    ],
    components: {
        HistoricalSessionSelector
    },
    computed: {
        filteredByMessageString() {
            let sessionOrSessions;

            if (this.activeSessions.numbers.length === 1) {
                sessionOrSessions = 'session'
            } else {
                sessionOrSessions = 'sessions'
            }
            return `Historical queries filtered by ${this.activeSessions.numbers.length} ${sessionOrSessions}`;
        }
    },
    data() {
        return {
            activeSessions: {},
            numFilteredSessions: 8,
            availableSessions: [],
            showSessionSelector: false,
            isRequestingSessions: false,
            historicalSessionDisabled: false
        }
    },
    methods: {
        onActiveSessionChange(sessions) {
            if (sessions) {
                this.activeSessions = sessions;
            } else {
                this.activeSessions = {};
            }
        },  
        setAvailableSessions(sessions) {
            this.isRequestingSessions = false;
            this.availableSessions = sessions;
        },
        openSessionSelector() {
            this.showSessionSelector = true;
        },
        closeSessionSelector() {
            this.showSessionSelector = false;
        },
        clearAllSessions() {
            this.sessionService.setHistoricalSession();
        },
        checkForHistoricalSessions() {
            this.isRequestingSessions = true;
            this.sessionService.getHistoricalSessions({}).then(this.setAvailableSessions);
        }
    },
    mounted() {
        this.sessionService = SessionService();
        this.historicalSessionDisabled = this.sessionService.historicalSessionFilterConfig.disable;

        window.setTimeout(this.checkForHistoricalSessions, 2000);

        this.unsubscribeSessionListener = this.sessionService.listenForHistoricalChange(this.onActiveSessionChange);

        let activeSessions = this.sessionService.getHistoricalSession();
        this.onActiveSessionChange(activeSessions);
    },
    destroyed() {
        this.table.extendsDestroy();    
        this.unsubscribeSessionListener();
    }
}
</script>
