export default function existingNamespaceUpdateInterceptor(openmct, usersNamespace) {
    openmct.objects.addGetInterceptor({
        appliesTo: (identifier, domainObject) => {
            return true;
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
