import { defineComponent } from 'vue';
import mcws from '../services/mcws/mcws.js';

export default defineComponent({
  inject: ['openmct'],
  props: {
    row: {
      type: Object,
      required: true
    },
    columnKey: {
      type: String,
      required: true
    },
    objectPath: {
      type: Array,
      required: true
    }
  },
  computed: {
    formattedValue() {
      return this.row.isComplete() ? this.row.getFormattedValue(this.columnKey) : undefined;
    }
  },
  methods: {
    async preview(fileType) {
      const datum = this.row.datum;

      if (fileType !== '.emd' || !datum.emd_preview) {
        return;
      }

      const element = document.createElement('div');
      element.className = 'abs loading';

      this.openmct.overlays.overlay({
        element,
        size: 'small',
        dismissible: true
      });

      try {
        const response = await mcws.opaqueFile(datum.emd_preview).read();
        const text = await response.text();
        const preElement = document.createElement('pre');
        const codeElement = document.createElement('code');

        preElement.appendChild(codeElement);
        element.className = 'abs scroll';
        codeElement.textContent = text;
        element.appendChild(preElement);
      } catch (error) {
        let reason = 'Unknown Error';

        if (error?.data?.description) {
          reason = error.data.description;
        }

        element.className = 'abs scroll';
        element.textContent = `Failed to load data product content from ${datum.emd_preview} due to: "${reason}"`;
      }
    }
  }
});
