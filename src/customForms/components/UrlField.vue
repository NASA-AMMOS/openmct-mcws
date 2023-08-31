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
  </span>
</template>

<script>
import { throttle, debounce } from 'lodash';

export default {
  props: {
    model: {
      type: Object,
      required: true
    },
    baseUrl: {
      type: String,
      default: ''
    }
  },
  watch: {
    testUrl() {
      this.checkUrl();
    }
  },
  computed: {
    testUrl() {
      if (field.startsWith('ws')) {
        return field.replace('ws', 'http');
      } else if (field.startsWith('//')) {
        return `${window.location.protocol}${field}`;
      } else if (field.startsWith('/')) {
        return `${window.openmctMCWSConfig.mcwsUrl}${field}`;
      } else {
        return field;
      }
    }
  },
  data() {
    return {
      field: this.model.value
    };
  },
  mounted() {
    this.updateText = throttle(this.updateText.bind(this), 500);
    this.checkUrl = debounce(
      this.checkUrl.bind(this),
      800,
      { trailing: true }
    );
  },
  methods: {
    updateText() {
      const data = {
        model: this.model,
        value: this.field
      };

      this.$emit('onChange', data);
    }
  }
};
</script>
