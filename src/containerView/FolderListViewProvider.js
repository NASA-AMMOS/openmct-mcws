import FolderListViewComponent from 'openmct.views.FolderListViewComponent';
import Vue from 'vue';

export default class FolderListView {
    constructor(openmct, types) {
        this.openmct = openmct;
        this.types = types;

        this.key = 'vista.folderListView';
        this.name = 'Folder List View';
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
                        listViewComponent: FolderListViewComponent
                    },
                    provide: {
                        openmct,
                        domainObject
                    },
                    template: '<list-view-component></list-view-component>'
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