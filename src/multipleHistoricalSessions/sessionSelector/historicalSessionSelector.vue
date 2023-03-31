<template>
    <div class="c-hss">
        <template v-if="isLoading">
            <div class="c-overlay__top-bar">
                <div class="c-overlay__dialog-title">Loading historical sessions...</div>
            </div>
            <div class="c-overlay__contents-main c-hss__view-wrapper">
                <div class="wait-spinner"></div>
            </div>
        </template>

        <template v-if="!isLoading">
            <div class="c-overlay__top-bar">
                <div class="c-overlay__dialog-title">Select Historical Sessions</div>
                <div class="c-overlay__dialog-hint">Select one or more sessions to use for historical queries. Note that sessions may only be selected within one host at a time.</div>
            </div>
            <div class="c-overlay__contents-main c-hss__view-wrapper">
                <!-- Left column -->
                <div class="c-hss__section c-hss__hosts section-host">
                    <div class="c-hss__section__header c-tab">Hosts</div>
                    <ul class="c-hss__section__content">
                        <li v-for="host in hosts"
                            :key="host"
                            class="c-tree__item-h"
                            @click="selectHostAndFilterSessions(host)">
                            <div class="c-tree__item"
                                :class="{'is-navigated-object': host === selectedHost }">
                                <a class="c-tree__item__label c-object-label">
                                    <div class="c-tree__item__name c-object-label__name">{{ host }}</div>
                                </a>
                            </div>
                        </li>
                    </ul>
                </div>
                <!-- Right column -->
                <div class="c-hss__section c-hss__sessions section-selector">
                    <div class="c-hss__section__header c-tab">Sessions</div>
                    <div class="c-hss__section__content">
                        <TelemetryTable
                            :marking="markingProp"
                            :enable-legacy-toolbar="true"
                            @marked-rows-updated="updateSelectedSessions">
                        </TelemetryTable>
                    </div>
                </div>
            </div>
            <div class="c-overlay__button-bar">
                <a class="c-button c-button--major"
                    :class="{disabled: !selectedSessions.length}"
                    @click="applyHistoricalSessions">
                    Filter By Selected Sessions
                </a>
                <a class="c-button"
                    :class="{disabled: !activeSessions}"
                    @click="clearHistoricalSessions">
                    Clear Filtering
                </a>
                <a class="c-button"
                    @click="closeOverlay">
                    Cancel
                </a>
            </div>
        </template>
    </div>
</template>

<style lang="scss">
    .c-historical-session-selector,
    .c-hss {
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;

        > * {
            flex: 0 0 auto;
        }

        &__view-wrapper {
            display: flex;
            flex: 1 1 auto !important;
            flex-direction: row !important;
            padding-right: 0 !important;

            > * + * {
                margin-left: 3px;
            }

            .c-table-control-bar {
                margin: 0 0 2px 0;
            }

            .c-table {
                margin-top: 0;
            }

            .paused{
                border: none;
            }
            .wait-spinner{
                width: 75px;
                height: 75px;
            }
        }

        &__section {
            // hosts and sessions
            display: flex;
            flex-direction: column;

            &__header {
                flex: 0 0 auto !important;
                &.c-tab {
                    // Yes, yes, this isn't good...
                    --notchSize: 0;
                    margin: 0 0 2px 0;
                    pointer-events: none;
                }
            }

            &__content {
                flex: 1 1 auto;
            }
        }

        &__hosts {
            flex: 0 0 auto;
            min-width: 100px;
            width: 10%;

            &__content {
                overflow: auto;
            }

            .c-tree__item {
                border-radius: 0 !important;
            }
        }

        &__sessions {
            flex: 1 1 auto;
        }
    }
</style>

<script>
import TelemetryTable from 'openmct.tables.components.Table';
import SessionService from 'services/session/SessionService';

export default {
    inject: ['openmct', 'table'],
    props: ['activeSessions'],
    components: {
        TelemetryTable
    },
    data() {
        return {
           hosts: [],
           selectedHost: '',
           sessionsFilteredByHost: [],
           selectedSessions: [],
           markingProp: {
                enable: true,
                useAlternateControlBar: true,
                rowName: "Session",
                rowNamePlural: "Sessions"
            },
            isLoading: true
        }
    },
    beforeDestroy() {
        this.table.destroy();
    },
    methods: {
        getUniq(key, array) {
            let entries = array.map(session => session[key]);

            return [...new Set(entries)];
        },
        updateDataInTable(sessions) {
            this.table.clearAndUpdateData(sessions);
        },
        selectHostAndFilterSessions(host){
            this.selectedHost = host;
            this.sessionServiceFilteredByHost = this.availableSessions.filter(session => session.host === host);
            this.$nextTick(() => {
                this.updateDataInTable(this.sessionServiceFilteredByHost);
            });
        },
        setMarkedSessions() {
            if(this.activeSessions.numbers && this.activeSessions.host) {
                this.availableSessions.forEach(session => {
                    if (this.activeSessions.numbers.some((sessionNumber => sessionNumber == session.number))
                        && this.activeSessions.host === session.host) {

                        session.marked = true;
                    }
                });
            }
        },
        setAvailableSessions(sessions) {
            this.$emit('update-available-sessions', sessions);
            let primaryHost;

            this.isLoading = false;
            this.availableSessions = sessions;
            this.setMarkedSessions();
            this.hosts = this.getUniq('host', this.availableSessions)
            
            if (this.activeSessions.host) {
                primaryHost = this.activeSessions.host
            } else {
                primaryHost = this.hosts[0];
            }

            this.selectHostAndFilterSessions(primaryHost);
        },
        getAvailableSessions() {
            this.sessionService.getHistoricalSessions({}).then(this.setAvailableSessions);
        },
        updateSelectedSessions(sessions) {
            this.selectedSessions = sessions;
        },
        clearHistoricalSessions() {
            this.sessionService.setHistoricalSession();
            this.closeOverlay();
        },
        applyHistoricalSessions() {
            let selectedSessions  = this.selectedSessions.map(row => row.datum),
                host = this.selectedHost,
                startTime,
                endTime;

                selectedSessions.forEach((session, index) => {
                    if (index === 0) {
                        startTime = session.start_time;
                        endTime = session.end_time;
                    }

                    if(session.start_time < startTime) {
                        startTime = session.start_time
                    }
                    
                    if (session.end_time > endTime) {
                        endTime = session.end_time;
                    }
                });

            let sessionObject = {
                host,
                start_time: startTime,
                end_time: endTime,
                numbers: selectedSessions.map(s => s.number)
            }

            this.sessionService.setHistoricalSession(sessionObject);
            this.closeOverlay();
        },
        closeOverlay() {
            if (this.overlay) {
                this.overlay.dismiss();
                delete this.overlay;
            }
        },
        openOverlay() {
            this.overlay = this.openmct.overlays.overlay({
                element: this.$el,
                size: 'large',
                dismissable: true,
                onDestroy: () => {
                   this.$emit('close-session-selector'); 
                }
            });
        }
    },
    mounted() {
        this.sessionService = SessionService();

        this.getAvailableSessions();
        this.openOverlay();
    }
}
</script>
