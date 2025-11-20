import { substituteVariables, runtimeSubstitutions } from "./mct-builder-core.js";

export default async function installBuiltinPlugin({openmct, installFunction, installFunctionOptions, buildTimeSubstitutions}) {
    const optionsWithSubstitutions = substituteVariables(installFunctionOptions, {
        ...buildTimeSubstitutions,
        ...runtimeSubstitutions
    });
    openmct.install(installFunction(optionsWithSubstitutions));
}