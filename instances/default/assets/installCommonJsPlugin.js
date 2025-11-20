import loadUmd from './load-umd.js';
export default async function installCommonJsPlugin({openmct, importPath, installFunctionName, installFunctionOptions}) {
    const imports = await loadUmd(importPath);
    if (typeof imports === 'function') {
        const installFunction = imports;
        openmct.install(installFunction(installFunctionOptions));
    } else if (typeof imports === 'object') {
        const exportedFunctionNames = Object.keys(imports);
        if (exportedFunctionNames.length === 1) {
            const resolvedInstallFunctionName = exportedFunctionNames[0];
            const installFunction = imports[resolvedInstallFunctionName];
            openmct.install(installFunction(installFunctionOptions));
        } else {
            const exportedFunctionMap = exportedFunctionNames.reduce((map, key) => {
                map.set(key.toLowerCase().replaceAll(/[^a-z0-9]/g, ''), imports[key]);
                return map;
            }, new Map());
            const installFunction = exportedFunctionMap.get(installFunctionName.toLowerCase().replaceAll(/[^a-z0-9]/g, ''));
            openmct.install(installFunction(installFunctionOptions));
        }
    } else {
        console.error(`Unsupported import type for ${importPath}`);
    }
}