import { CHANNEL_TABLE_KEY, CHANNEL_TABLE_SET_KEY } from '../constants.js';

export default function channelTableSetCompositionPolicy(openmct) {
  return function (parent, child) {
    if (parent.type === CHANNEL_TABLE_SET_KEY) {
      return child.type === CHANNEL_TABLE_KEY;
    }

    return true;
  };
}
