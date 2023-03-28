
function plugin(customFormatsArray) {
    return function install (openmct) {
        customFormatsArray.forEach(customFormat => {
            if (!customFormat.key && !customFormat.format) {
                console.error('Custom Formats need to have a unique key property and a format function');
            }

            openmct.telemetry.addFormat(customFormat);
        });
    }
}

export default plugin;
