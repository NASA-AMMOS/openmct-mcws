const simpleTimeMathRegex = /^(now)?\s*([-+]?\s*\d+)?$/;

function getEpochTime(timeExpression) {
    const now = Date.now();
    const regexResult = simpleTimeMathRegex.exec(timeExpression);
    if (regexResult) {
        const isOffsetFromNow = regexResult[1] === 'now';
        if (isOffsetFromNow) {
            const offsetString = regexResult[2] || '0';
            const offset = parseInt(offsetString.replaceAll(' ', ''), 10);
            return now + offset;

        }
        return timeExpression;
    }
    return timeExpression;
}
export function helloPanda() {
    return function install(openmct) {
        openmct.once('start', () => {
            alert('hello panda');
        });
    }
}
export function testRelativeAssetPaths({testAsset}) {
    return function install(openmct) {
        openmct.once('start', async () => {
            const asset = await fetch(testAsset);
            const assetText = await asset.text();
            console.log(`Asset text: ${assetText}`);
        });
    }
}
export function mctBootstrapPlugin({timeSystem, clock, start, end, startOffset, endOffset, mode} = {timeSystem: 'utc', clock: 'local', start: 'now - 900000', end: 'now', startOffset: -60000, endOffset: 0, mode: 'realtime'}) {
    return function install(openmct) {
        openmct.install(openmct.plugins.UTCTimeSystem());
        openmct.time.setTimeSystem(timeSystem);
        openmct.time.setClock(clock);

        if (mode === 'fixed') {
            start = getEpochTime(start);
            end = getEpochTime(end);
            openmct.time.setMode(mode, {start, end});
        } else {
            openmct.time.setMode(mode, {start: startOffset, end: endOffset});
        }
    }
}