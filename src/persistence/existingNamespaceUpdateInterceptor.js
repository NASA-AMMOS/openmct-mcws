export default function existingNamespaceUpdateInterceptor(openmct) {
    openmct.objects.addGetInterceptor({
        appliesTo: (identifier, domainObject) => {
            return true;
        },
        invoke: (identifier, object) => {
            console.log(identifier, object);
            // if (object === undefined) {
            //     const keyString = openmct.objects.makeKeyString(identifier);
            //     openmct.notifications.error(`Failed to retrieve object ${keyString}`, { minimized: true });

            //     return {
            //         identifier,
            //         type: 'unknown',
            //         name: 'Missing: ' + keyString
            //     };
            // }

            return object;
        }
    });
}
