
function importFromJSONModifier(openmct) {
    let importFromJSONAction = openmct.actions._allActions['import.JSON'];

    if (importFromJSONAction) {
        let originalAppliesToFunction = importFromJSONAction.appliesTo.bind(importFromJSONAction);

        importFromJSONAction.appliesTo = (objectPath) => {
            let domainObject = objectPath[0];
            let type = openmct.types.get(domainObject.type);

            if (domainObject.type === 'vista.dataset') {
                return false;
            }

            if (type.definition && !type.definition.creatable) {
                return false;
            }

            return originalAppliesToFunction(objectPath);
        }
    }
}

export default importFromJSONModifier;
