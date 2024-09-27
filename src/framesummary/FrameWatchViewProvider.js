import mount from 'ommUtils/mountVueComponent';
import FrameWatchTable from './FrameWatchTable';
import FrameWatchViewComponent from './components/FrameWatchViewComponent.vue';
import { FRAME_WATCH_TYPE } from './config';

export default class FrameWatchViewProvider {
    constructor(openmct, key, name, options, type = FRAME_WATCH_TYPE) {
        this.openmct = openmct;
        this.options = options;

        this.key = key;
        this.name = name;
        this.cssClass = 'icon-tabular-lad';
        this.type = type;
    }

    canView(domainObject) {
        return domainObject.type === this.type || domainObject.type === 'vista.frameSummary';
    }

    view(domainObject, objectPath) {
        let component;
        let _destroy = null;
      
        const table = new FrameWatchTable(domainObject, this.openmct, this.options, this.type);

        const view = {
            show: function (element, editMode, { renderWhenVisible }) {
                const componentDefinition = {
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
                        currentView: view,
                        renderWhenVisible
                    },
                    template: `
                        <frame-watch-view-component
                            ref="frameWatchViewComponent"
                            :view="view"
                            :isEditing="isEditing"
                        />
                    `
                };
                
                const componentOptions = {
                    element
                };
                
                const {
                    componentInstance,
                    destroy,
                    el
                } = mount(componentDefinition, componentOptions);
                
                component = componentInstance;
                _destroy = destroy;
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
            destroy: function () {
                _destroy?.();
            }
        };

        return view;
    }
     
    canEdit(domainObject) {
        return domainObject.type === this.type;
    }
}
