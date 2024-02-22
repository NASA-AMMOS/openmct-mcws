export default function existingNamespaceUpdateInterceptor(openmct, usersNamespace, shouldCheck) {
    // not all instances utilize user namespaces
    if (!usersNamespace) {
        return;
    }

    let loggedNamespaceCheck = false;

    openmct.objects.addGetInterceptor({
        appliesTo: (identifier, domainObject) => {
            return shouldCheck;
        },
        invoke: (identifier, object) => {
            // check for old user namespace style
            if (object.location === usersNamespace.key) {
                object.location = usersNamespace.id;
                openmct.objects.mutate(object, 'location', usersNamespace.id);
            }

            // check for old composition style
            if (object.composition?.length) {
                let updatedComposition = false;

                object.composition = object.composition.map((keystring) => {
                    if (typeof keystring === 'string') {
                        updatedComposition = true;

                        return openmct.objects.parseKeyString(keystring);
                    }

                    return keystring;
                });

                if (updatedComposition) {
                    openmct.objects.mutate(object, 'composition', object.composition);
                }
            }

            // turn off if we've checked the user folder
            if (!loggedNamespaceCheck && (object.location === usersNamespace.key || object.location === usersNamespace.id)) {
                localStorage.setItem(`r5.0_old_namespace_checked:${usersNamespace.key}`, 'true');
                loggedNamespaceCheck = true;
            }

            return object;
        }
    });
}
