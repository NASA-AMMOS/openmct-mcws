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
import { throttle } from 'lodash';

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
  data() {
    return {
      field: this.model.value
    };
  },
  mounted() {
    this.updateText = throttle(this.updateText.bind(this), 500);
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
