import ChannelTable from './ChannelTable';
import TableComponent from 'openmct.tables.components.Table';
import Vue from 'vue';

export default class ChannelTableViewProvider { 
    constructor(openmct) {
        this.openmct = openmct;
        this.key = 'vista.channel-list';
        this.name = 'Channel List';
        this.cssClass = 'icon-tabular-realtime';

        this.view = this.view.bind(this);
    }
    
    canView(domainObject) {
        return domainObject.type === 'vista.chanTableGroup';
    }

    canEdit(domainObject) {
        return domainObject.type === 'vista.chanTableGroup';
    }

    view(domainObject, objectPath) {
        let component;
        let markingProp = {
            enable: true,
            useAlternateControlBar: false,
            rowName: '',
            rowNamePlural: ''
        };

        const table = new ChannelTable(domainObject, this.openmct);
        const view = {
            show(element, isEditing) {
                component = new Vue({
                    data() {
                        return {
                            isEditing,
                            markingProp,
                            view
                        }
                    },
                    components: {
                        TableComponent
                    },
                    provide: {
                        openmct,
                        table,
                        objectPath,
                        currentView: view
                    },
                    el: element,
                    template: `
                    <table-component
                        class="js-channel-list-view"
                        ref="tableComponent"
                        :isEditing="isEditing"
                        :marking="markingProp"
                        :allowFiltering="false"
                        :allowSorting="false"
                        :view="view"
                    ></table-component>`
                });
            },
            onEditModeChange(isEditing) {
                component.isEditing = isEditing;
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
            destroy() {
                component.$destroy();
                component = undefined;
            }
        }

        return view;
    }

    priority() {
        return 851;
    }
};
