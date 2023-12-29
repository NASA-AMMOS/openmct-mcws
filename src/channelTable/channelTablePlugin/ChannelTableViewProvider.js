import ChannelTable from './ChannelTable';
import TableComponent from 'openmct.tables.components.Table';
import { createApp } from 'vue';

export default class ChannelTableViewProvider { 
    constructor(openmct) {
        this.openmct = openmct;
        this.key = 'vista.channel-list';
        this.name = 'Channel List';
        this.cssClass = 'icon-tabular-realtime';
        this.component = undefined;
        this.destroy = null;

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
                this.component = createApp({
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

                this.destroy = () => this.component.unmount();
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
                this.destroy?.();
            }
        }

        return view;
    }

    priority() {
        return 851;
    }
};
