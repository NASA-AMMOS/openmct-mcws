<template>
  <span
    style="display: flex;flex-direction: row;"
    class="form-control shell"
  >
    <span
      class="field control"
      style="display: flex;flex: 1 1 auto;"
      :class="model.cssClass"
    >
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
      style="display: flex;flex: 0 1 auto;opacity: 0.7;font-size: 1em;padding: 5px;color: #FF8A0D;"
      class="icon-alert-triangle hint"
      alt="Unable to connect"
      title="Unable to connect"
      v-if="warn"
    ></span>
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

        if (response.status === 404) {
          throw new Error(response.status);
        }

        this.warn = false;
      } catch (error) {
          this.warn = true;
          console.warn(error.message);
      }
    }
  }
};
</script>
