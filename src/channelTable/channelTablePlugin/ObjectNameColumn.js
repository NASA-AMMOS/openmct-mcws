define(function () {
    class ObjectNameColumn {
        constructor (objectName) {
            this.objectName = objectName;
        }

        getKey() {
            return 'vista-lad-name';
        }

        getTitle() {
            return "Name";
        }

        getMetadatum() {
            return {};
        }

        hasValueForDatum() {
            return true;
        }

        getRawValue() {
            return this.objectName;
        }

        getFormattedValue() {
            return this.objectName;
        }

    };

    return ObjectNameColumn;
});
