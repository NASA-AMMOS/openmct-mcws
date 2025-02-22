<template>
  <div class="h-indicator">
    <div
      class="c-indicator icon-session"
      :class="{
        's-status-on': sessionFilter.numbers,
        's-status-available': availableSessions.length
      }"
    >
      <span v-if="historicalSessionFilterDisabled" class="c-indicator__label">
        <span class="angular-w"> Historical Session Filtering Disabled in Config </span>
      </span>

            <span
                v-else
                class="c-indicator__label"  
                style="display:flex; flex-direction:column;"
            >

                <template v-if="availableSessions.length">

                    <span 
                        v-if="sessionFilter.numbers"
                        :title="filteredByTitleString"
                        class="angular-w"
                    >
                        {{filteredByMessageString}}
                        <button @click="openSessionSelector">
                            Change
                        </button>
                        <button @click="clearAllSessions">
                            Clear
                        </button>
                    </span>

          <span v-else class="angular-w">
            Filter by historical sessions
            <button @click="openSessionSelector">Select</button>
          </span>
        </template>

        <span v-else class="angular-w">
          No Historical Sessions Available
          <button :class="{ disabled: isRequestingSessions }" @click="checkForHistoricalSessions">
            {{ isRequestingSessions ? 'Requesting...' : 'Request' }}
          </button>
        </span>
      </span>
    </div>

    <historical-session-selector
      v-if="showSessionSelector"
      :sessionFilter="sessionFilter"
      @update-available-sessions="setAvailableSessions"
      @close-session-selector="closeSessionSelector"
    />
  </div>
</template>

<style></style>

<script>
import HistoricalSessionSelector from '../sessionSelector/historicalSessionSelector.vue';
import SessionService from 'services/session/SessionService';
import { formatMultipleSessionNumbers } from '../../utils/strings';
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

            if (this.sessionFilter.numbers.length === 1) {
                sessionOrSessions = `session: ${this.sessionFilter.numbers[0]}`;
            } else {
                sessionOrSessions = 'sessions';
            }
            return `Historical queries filtered by ${this.sessionFilter.numbers.length} ${sessionOrSessions}`;
        },
        filteredByTitleString() {
            let sessionNumbers = formatMultipleSessionNumbers(this.sessionFilter.numbers);

            return `Currently filtering on host ${this.sessionFilter.host} by: ${sessionNumbers}`;
        }
    },
    data() {
        return {
            sessionFilter: {},
            numFilteredSessions: 8,
            availableSessions: [],
            showSessionSelector: false,
            isRequestingSessions: false,
            historicalSessionFilterDisabled: false
        }
    },
    methods: {
        setHistoricalSessionFilter(sessions) {
            if (sessions) {
                this.sessionFilter = sessions;
            } else {
                this.sessionFilter = {};
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
            this.sessionService.setHistoricalSessionFilter();
        },
        checkForHistoricalSessions() {
            this.isRequestingSessions = true;
            this.sessionService.getHistoricalSessions({}).then(this.setAvailableSessions);
        }
    },
    mounted() {
        this.sessionService = SessionService();
        this.historicalSessionFilterDisabled = this.sessionService.historicalSessionFilterConfig.disable;

    window.setTimeout(this.checkForHistoricalSessions, 2000);

    this.unsubscribeSessionListener = this.sessionService.listenForHistoricalChange(
      this.setHistoricalSessionFilter
    );

    const sessionFilter = this.sessionService.getHistoricalSessionFilter();
    this.setHistoricalSessionFilter(sessionFilter);
  },
  beforeUnmount() {
    this.table.extendsDestroy();
    this.unsubscribeSessionListener();
  }
};
</script>
