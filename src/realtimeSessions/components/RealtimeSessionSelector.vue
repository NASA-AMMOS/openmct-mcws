<template>
<div class="u-contents">
    <template
        v-if="isLoading"
    >
        <div class="c-overlay__top-bar">
            <div class="c-overlay__dialog-title">Loading Real-time Data Sources...</div>
        </div>
        <div class="c-overlay__contents-main c-hss__view-wrapper">
            <div class="wait-spinner"></div>
        </div>
    </template>

    <template>
        <div class="c-overlay__top-bar">
            <div class="c-overlay__dialog-title">Select Real-time Data Source</div>
        </div>
        <div class="c-overlay__dialog-hint">
            <span
                v-if="topics.length"
            >Select a topic or session</span>
            <span
                v-else
            >No topics are currently available</span>
        </div>

        <div class="l-topics-tree-wrapper selector-list">
            <ul class="c-tree l-topics-tree">
                <li
                    v-for="(topic, index) in topics"
                    :key="index"
                    class="c-tree__item-h"
                >
                    <div
                        class="c-tree__item"
                        :class="{ 'is-selected': topic.selected }"
                    >
                        <span
                            class="c-disclosure-triangle c-tree__item__view-control"
                            :class="{
                                'c-disclosure-triangle--expanded': topic.expanded,
                                'is-enabled': topic.sessions.length
                            }"
                            @click="topic.expanded = !topic.expanded"
                        >
                        </span>
                        <div
                            class="c-object-label c-tree__item__label"
                            @click="select(topic)"
                        >
                            <span class="c-tree__item__type-icon c-object-label__type-icon icon-topic"></span>
                            <div class='c-tree__item__name c-object-label__name'>
                                {{ topic.data.topic }}
                            </div>
                        </div>
                    </div>

                    <span
                        v-show="topic.expanded"
                        class="c-tree__item__subtree"
                    >
                        <ul class="c-tree">
                            <li
                                v-for="(session, index) in topic.sessions"
                                :key="index"
                                class="c-tree__item-h"
                            >
                                <span
                                    :class="{ 'is-selected': session.selected }"
                                    class="c-tree__item"
                                    @click="select(session)"
                                >
                                    <div class="c-object-label c-tree__item__label">
                                        <span class="c-tree__item__type-icon c-object-label__type-icon icon-session"></span>
                                        <div class='c-tree__item__name c-object-label__name'>
                                            {{ session.data.number }}
                                        </div>
                                    </div>
                                </span>
                            </li>
                        </ul>
                    </span>
                </li>
            </ul>
        </div>

        <div class="c-overlay__button-bar">
            <button
                :class="{ disabled: !selection }"
                class="c-button c-button--major"
                @click="setActiveTopicOrSession()"
            >
                Connect
            </button>
            <button
                @click="cancel()"
                class="c-button"
            >
                Cancel
            </button>
        </div>
    </template>
</div>
</template>

<script>
import SessionService from 'services/session/SessionService';

export default {
    inject: [
        'openmct'
    ],
    data() {
        return {
            isLoading: true,
            selection: undefined,
            topics: [],
            modelStore: []
        }
    },
    mounted() {
        this.sessionService = SessionService();
        this.loadSessions();

        this.openOverlay();
    },
    methods: {
        select(model) {
            this.modelStore.forEach(otherModel => {
                otherModel.selected = false;
            });

            model.selected = true;

            this.selection = model;
        },
        setActiveTopicOrSession() {
            this.sessionService.setActiveTopicOrSession(this.selection.data);

            this.closeOverlay();
        },
        cancel() {
            this.closeOverlay();
        },
        loadSessions() {
            this.isLoading = true;
            this.selection = undefined;
            this.topics = [];
            this.modelStore = [];

            this.sessionService
                .getTopicsWithSessions()
                .then(topics => {
                    this.topics = topics.map(this.topicAsModel);
                })
                .finally(() => {
                    this.isLoading = false;
                });
        },
        topicAsModel(topic) {
            const sessions = topic.sessions.map(session => this.sessionAsModel(session));
            const isSessionSelected = sessions.some(session => session.selected);

            const topicModel = {
                selected: this.sessionService.isActiveTopic(topic) && !isSessionSelected,
                data: topic,
                expanded: isSessionSelected,
                sessions
            };

            if (topicModel.selected) {
                this.selection = topicModel;
            }

            this.modelStore.push(topicModel);

            return topicModel;
        },
        sessionAsModel(session) {
            const sessionModel = {
                selected: this.sessionService.isActiveSession(session),
                data: session
            };

            if (sessionModel.selected) {
                this.selection = sessionModel;
            }

            this.modelStore.push(sessionModel);

            return sessionModel;
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
        },
        closeOverlay() {
            if (this.overlay) {
                this.overlay.dismiss();
                delete this.overlay;
            }
        }
    }
}
</script>
