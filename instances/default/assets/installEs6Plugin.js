export default async function installEs6Plugin({openmct, importPath, installFunctionName, installFunctionOptions}) {
    const imports = await import(importPath);
    const exportedNames = Object.keys(imports);
    // If only one export, assume it is the install function. This simplifies things for the 90% case of a single default export
    if (exportedNames.length === 1) {
        const resolvedInstallFunctionName = exportedNames[0];
        const installFunction = imports[resolvedInstallFunctionName];
        openmct.install(installFunction(installFunctionOptions));
    } else {
        const exportedFunctionMap = Object.keys(imports).reduce((map, key) => {
            map.set(key.toLowerCase().replaceAll(/[^a-z0-9]/g, ''), imports[key]);
            return map;
        }, new Map());
        const installFunction = exportedFunctionMap.get(installFunctionName.toLowerCase().replaceAll(/[^a-z0-9]/g, ''));
        openmct.install(installFunction(installFunctionOptions));
    }
}