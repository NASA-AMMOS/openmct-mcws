define([
    './MessageStreamProcessor'
], 
function (
    MessageStreamProcessor
) {
    return function install(url, supportedMessagesObject) {

        return function plugin(openmct) {

            openmct.on('start', () => {
                let messageStreamProcessor = new MessageStreamProcessor.default(url, supportedMessagesObject, openmct);
                
                messageStreamProcessor.subscribe();
            });
        };
    };
});
