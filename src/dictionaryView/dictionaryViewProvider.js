import DictionaryView from './components/dictionaryView.vue';
import DictionaryViewTable from './dictionaryViewTable.js';
import Vue from 'vue';

export default class DictionaryViewProvider {
    constructor(openmct) {
        this.key = 'dictionary-view';
        this.name = 'Dictionary View';
        this.cssClass = 'icon-dataset';

        this.openmct = openmct;
    }

    canView(domainObject) {
        return domainObject.type === 'vista.dictionary';
    }

    view(domainObject, objectPath) {
        let component;

        let table = new DictionaryViewTable(domainObject, openmct);
        const markingProp = {
            enable: true,
            useAlternateControlBar: false,
            rowName: '',
            rowNamePlural: ''
        };

        const view = {
            show: function (element, editMode) {
                component =  new Vue({
                    el: element,
                    components: {
                        DictionaryView
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
                        domainObject,
                        table,
                        objectPath,
                        currentView: view
                    },
                    template: `
                        <dictionary-view
                            ref="dictionaryView"
                            class="v-dictionary"
                            :isEditing="isEditing"
                            :allowSorting="true"
                            :marking="markingProp"
                            :view="view"
                        >
                            <template v-slot:buttons></template>
                        </dictionary-view>
                    `,
                });
            },
            onEditModeChange(editMode) {
                component.isEditing = editMode;
            },
            onClearData() {
                table.clearData();
            },
            getViewContext() {
                return {};
            },
            destroy: function (element) {
                component.$destroy();
                component = undefined;
            }
        };

        return view;
    }
}
