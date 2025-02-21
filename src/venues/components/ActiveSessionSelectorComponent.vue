<template>
  <div class="l-venue-section l-active-session-selector" :class="{ loading: loading }">
    <div v-if="!topics.length" class="blank">No topics currently available</div>
    <div v-if="topics.length" class="l-topics-selector">
      <div class="label">Please select a topic or session:</div>
      <div class="l-topics-tree-wrapper selector-list">
        <ul class="c-tree l-topics-tree">
          <li v-for="topic in topics" :key="topic.model.id" class="c-tree__item-h">
            <div class="c-tree__item" :class="{ 'is-selected': isSelected(topic.model) }">
              <span
                class="c-disclosure-triangle c-tree__item__view-control"
                @click="topic.expanded = !topic.expanded"
                :class="{
                  'c-disclosure-triangle--expanded': topic.expanded,
                  'is-enabled': topic.model.sessions.length
                }"
              >
              </span>
              <div class="c-object-label c-tree__item__label" @click="selectSession(topic.model)">
                <span class="c-tree__item__type-icon c-object-label__type-icon icon-topic"></span>
                <div class="c-tree__item__name c-object-label__name">
                  {{ topic.model.topic }}
                </div>
              </div>
            </div>
            <span class="c-tree__item__subtree" v-if="topic.expanded">
              <ul class="c-tree">
                <li
                  v-for="session in topic.model.sessions"
                  :key="session.id"
                  class="c-tree__item-h"
                >
                  <span
                    class="c-tree__item"
                    :class="{ 'is-selected': isSelected(session) }"
                    @click="selectSession(session)"
                  >
                    <div class="c-object-label c-tree__item__label">
                      <span
                        class="c-tree__item__type-icon c-object-label__type-icon icon-session"
                      ></span>
                      <div class="c-tree__item__name c-object-label__name">
                        {{ session.number }} {{ session.name }} on {{ session.host }}
                      </div>
                    </div>
                  </span>
                </li>
              </ul>
            </span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    venue: {
      type: Object,
      required: true
    },
    session: {
      type: Object,
      required: false,
      default: () => {}
    }
  },
  data() {
    return {
      topics: [],
      loading: false,
      loadCounter: 0
    };
  },
  watch: {
    venue(newVenue, oldVenue) {
      if (newVenue !== oldVenue) {
        this.loadSessions(newVenue);
      }
    }
  },
  mounted() {
    this.loadSessions(this.venue);
  },
  methods: {
    isSelected(session) {
      return this.session === session;
    },
    selectSession(session) {
      this.$emit('session-selected', session);
    },
    async loadSessions(venue) {
      if (!venue) {
        return;
      }

      this.loadCounter++;

      const currentLoad = this.loadCounter;

      this.loading = true;
      this.topics = [];

      try {
        const topics = await venue.getActiveSessions();

        if (currentLoad !== this.loadCounter || !topics.length) {
          return;
        }

        if (topics.length === 1 && topics[0].sessions.length === 1) {
          this.selectSession(topics[0].sessions[0]);
        }

        this.topics = topics.map((t) => ({
          model: t,
          expanded: t.sessions.some(this.isSelected)
        }));
      } catch (error) {
        if (currentLoad !== this.loadCounter) {
          return;
        }

        console.error('Error loading Sessions', error);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
