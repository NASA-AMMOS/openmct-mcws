define(['./cell-format-configuration.html'], function (CellFormatConfigurationTemplate) {
    return {
        inject: ['tableConfiguration', 'openmct'],
        template: CellFormatConfigurationTemplate,
        data() {
            let configuration = this.tableConfiguration.getConfiguration();
            let selection = this.openmct.selection.get()[0][0];

            configuration.cellFormat = configuration.cellFormat || {};
            let rowFormat = configuration.cellFormat[selection.context.row] || {};

            return {
                isEditing: this.openmct.editor.isEditing(),
                cellFormat: rowFormat[selection.context.column]
            }
        },
        methods: {
            toggleEdit(isEditing) {
                this.isEditing = isEditing;
            },
            formatCell(event) {
                let selection = this.openmct.selection.get()[0][0];
                let configuration = this.tableConfiguration.getConfiguration();

                configuration.cellFormat = configuration.cellFormat || {};
                configuration.cellFormat[selection.context.row] = configuration.cellFormat[selection.context.row] || {};
                configuration.cellFormat[selection.context.row][selection.context.column] = event.currentTarget.value;
                this.tableConfiguration.updateConfiguration(configuration);
            }
        },
        mounted() {
            this.openmct.editor.on('isEditing', this.toggleEdit);
        },
        destroyed() {
            this.tableConfiguration.destroy();
            this.openmct.editor.off('isEditing', this.toggleEdit);
        }
    }
});
