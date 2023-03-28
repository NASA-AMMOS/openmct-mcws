export default {
    inject: ['openmct'],
    props: {
        row: {
            type: Object,
            required: true
        },
        columnKey: {
            type: String,
            require: true
        }
    },
    computed: {
        formattedValue() {
            return this.row.isComplete()
            ? this.row.getFormattedValue(this.columnKey)
            : undefined;
        }
    },
    methods: {
        preview(fileType) {
            let overlayService = this.openmct.$injector.get('overlayService');
            let dialogModel = { datum: this.row.datum, fileType: fileType };
            let dialog = overlayService.createOverlay('product-dialog', dialogModel);
            dialogModel.cancel = dialog.dismiss.bind(dialog);
        }
    }
}
