import FolderGridViewComponent from 'openmct.views.FolderGridViewComponent';
import Vue from 'vue';

export default class FolderGridView {
    constructor(openmct, types) {
        this.openmct = openmct;
        this.types = types;

        this.key = 'vista.folderGridView';
        this.name = 'Folder Grid View';
        this.cssClass = 'icon-folder';
    }

    canView(domainObject) {
        return this.types.includes(domainObject.type);
    }

    view(domainObject, objectPath) {
        let component;

        return {
            show: function (element) {
                component = new Vue({
                    el: element,
                    components: {
                        gridViewComponent: FolderGridViewComponent
                    },
                    provide: {
                        openmct,
                        domainObject
                    },
                    template: '<grid-view-component></grid-view-component>'
                });
            },
            destroy: function (element) {
                component.$destroy();
                component = undefined;
            }
        };
    }

    priority() {
        return this.openmct.priority.LOW;
    }
}