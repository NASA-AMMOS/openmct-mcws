export default class BlankGridView {
    constructor(openmct, types) {
        this.openmct = openmct;
        this.types = types;

        this.key = 'vista.blankView';
        this.name = 'Default View';
        this.cssClass = 'icon-folder';
    }

    canView(domainObject) {
        return this.types.includes(domainObject.type);
    }

    view(domainObject, objectPath) {
        return {
            show: function (element) {
                // nothing to show
            },
            destroy: function (element) {
                // nothing to destroy
            }
        };
    }

    priority() {
        return this.openmct.priority.LOW;
    }
}
