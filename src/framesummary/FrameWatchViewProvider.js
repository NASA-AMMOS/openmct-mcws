import Vue from 'vue';
import FrameWatchTable from './FrameWatchTable';
import FrameWatchViewComponent from './components/FrameWatchViewComponent.vue';
import { FRAME_WATCH_TYPE } from './config';

export default class FrameWatchViewProvider {
    constructor(openmct, key, name, type = FRAME_WATCH_TYPE) {
        this.openmct = openmct;

        this.key = key;
        this.name = name;
        this.cssClass = 'icon-tabular-lad';
        this.type = type;
    }

    canView(domainObject) {
        return domainObject.type === this.type || domainObject.type === 'vista.frameSummary';
    }

    view(domainObject, objectPath) {
        let table = new FrameWatchTable(domainObject, openmct, this.type);
        let component;

        const view = {
            show: function (element, editMode) {
                component = new Vue({
                    el: element,
                    components: {
                        FrameWatchViewComponent
                    },
                    data() {
                        return {
                            isEditing: editMode,
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
                        <frame-watch-view-component
                            ref="frameWatchViewComponent"
                            :view="view"
                            :isEditing="isEditing"
                        />
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
                    let context = component.$refs.frameWatchViewComponent.getViewContext();

                    return context;
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
        return domainObject.type === this.type;
    }
}
