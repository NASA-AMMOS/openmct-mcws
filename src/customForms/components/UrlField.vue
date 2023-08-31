<template>
  <span class="form-control shell">
    <span class="field control" :class="model.cssClass">
      <input
        :id="`form-${model.key}`"
        v-model="field"
        :name="model.key"
        type="text"
        :size="model.size"
        @input="updateText()"
      />
    </span>
    <span
      style="opacity: 0.7;font-size: 1em;font-style: italic;padding: 5px;display: inline-block;"
      class="icon-alert-triangle hint"
      v-if="warn"
    >
      This url may be broken, check again or proceed with caution.
    </span>
  </span>
</template>

<script>
import { throttle, debounce } from 'lodash';

export default {
  props: {
    model: {
      type: Object,
      required: true
    }
  },
  watch: {
    testUrl() {
      this.checkUrl();
    }
  },
  computed: {
    testUrl() {
      if (!this.field) {
        return '';
      }

      let result = this.field ?? '';

      if (this.field.startsWith('ws')) {
        result = this.field.replace('ws', 'http');
      } else if (this.field.startsWith('//')) {
        result = `${window.location.protocol}${this.field}`;
      } else if (this.field.startsWith('/')) {
        result = `${window.openmctMCWSConfig.mcwsUrl}${this.field}`;
      }
        
      return result;
    }
  },
  data() {
    return {
      field: this.model.value,
      warn: false
    };
  },
  mounted() {
    this.updateText = throttle(this.updateText, 500);
    this.checkUrl = debounce(this.checkUrl, 800, { trailing: true });

    this.checkUrl();
  },
  methods: {
    updateText() {
      const data = {
        model: this.model,
        value: this.field
      };

      this.$emit('onChange', data);
    },
    async checkUrl() {
      if (this.testUrl === '') {
        this.warn = false;

        return;
      }

      try {
        const response = await fetch(this.testUrl, {
          method: 'HEAD'
        });

        if (response.ok) {
          this.warn = false;
        } else {
          this.warn = true;
        }
      } catch (error) {
        this.warn = true;
        console.warn(error.message);
      }
    }
  }
};
</script>
