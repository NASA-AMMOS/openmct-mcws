export default function existingNamespaceUpdateInterceptor(openmct, usersNamespace, shouldCheck) {
    let turnedOff = false;

    openmct.objects.addGetInterceptor({
        appliesTo: (identifier, domainObject) => {
            return shouldCheck;
        },
        invoke: (identifier, object) => {
            if (object.location === usersNamespace.key) {
                object.location = usersNamespace.id;
                openmct.objects.mutate(object, 'location', usersNamespace.id);
            }

            // turn off if we've checked the user folder
            if (!turnedOff && (object.location === usersNamespace.key || object.location === usersNamespace.id)) {
                localStorage.setItem('r5.0_old_namespaces_checked', 'true');
                turnedOff = true;
            }

            return object;
        }
    });
}
