/**
 * Promise.all will resolve when all promises at the time of calling Promise all resolve
 * This allows for checking all promises added after Promise.all is called
 * are resolved, granted that they are added before all promises resolve
 *
 * @param {Array<Promise>} promises
*/
async function dynamicPromiseAll(promises) {
    let resolved = [];

    while (resolved.length !== promises.length) {
        resolved = await Promise.all(promises);
    }

    return resolved;
}

export {
    dynamicPromiseAll
};
