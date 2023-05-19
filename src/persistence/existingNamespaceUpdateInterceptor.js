export default function existingNamespaceUpdateInterceptor(openmct, usersNamespace, shouldCheck) {
    openmct.objects.addGetInterceptor({
        appliesTo: (identifier, domainObject) => {
            console.log('check?', shouldCheck);
            return shouldCheck;
        },
        invoke: (identifier, object) => {
            if (object.location === usersNamespace.key) {
                object.location = usersNamespace.id;
                openmct.objects.mutate(object, 'location', usersNamespace.id);
                console.log(identifier, object);
            }

            return object;
        }
    });
}
