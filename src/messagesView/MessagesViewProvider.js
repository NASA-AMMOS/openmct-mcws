import MessagesTable from './MessagesTable.js';
import TableComponent from 'openmct.tables.components.Table';
import Vue from 'vue';

export default class MessagesViewProvider {
    constructor(openmct) {
        this.openmct = openmct;

        this.key = 'vista.messagesView';
        this.name = 'Messages View';
        this.cssClass = 'icon-tabular-lad';
    }

    canView(domainObject) {
        return domainObject.type === 'vista.messagesView';
    }

    view(domainObject, objectPath) {
        let table = new MessagesTable(domainObject, openmct);
        let component;
        let markingProp = {
            enable: true,
            useAlternateControlBar: false,
            rowName: '',
            rowNamePlural: ''
        };
        const view = {
            show: function (element, editMode) {
                component = new Vue({
                    el: element,
                    components: {
                        TableComponent
                    },
                    data() {
                        return {
                            isEditing: editMode,
                            markingProp,
                            view
                        };
                    },
                    provide: {
                        openmct,
                        table,
                        objectPath,
                        currentView: view
                    },
                    template: `
                        <table-component
                            ref="tableComponent"
                            class="v-messages"
                            :isEditing="isEditing"
                            :allowSorting="true"
                            :marking="markingProp"
                            :view="view"
                        >
                        </table-component>
                    `
                });
            },
            onEditModeChange(editMode) {
                component.isEditing = editMode;
            },
            onClearData() {
                table.clearData();
            },
            getViewContext() {
                if (component) {
                    return component.$refs.tableComponent.getViewContext();
                } else {
                    return {
                        type: 'telemetry-table'
                    };
                }
            },
            destroy: function (element) {
                component.$destroy();
                component = undefined;
            }
        };

        return view;
    }
     
    canEdit(domainObject) {
        return domainObject.type === 'vista.messagesView';
    }
}
