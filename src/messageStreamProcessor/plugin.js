import MessageStreamProcessor from './MessageStreamProcessor.js';

export default function install(url, supportedMessagesObject) {
  return function plugin(openmct) {
    openmct.on('start', () => {
      const messageStreamProcessor = new MessageStreamProcessor(
        url,
        supportedMessagesObject,
        openmct
      );

      messageStreamProcessor.subscribe();
    });
  };
}
