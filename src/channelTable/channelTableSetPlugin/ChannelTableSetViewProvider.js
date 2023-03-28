import { CHANNEL_TABLE_SET_ICON, CHANNEL_TABLE_SET_NAME, CHANNEL_TABLE_SET_VIEW_KEY, CHANNEL_TABLE_SET_KEY } from '../constants';
import ChannelTableSetView from './ChannelTableSetView.js';

export default class ChannelTableSetViewProvider {
    constructor(openmct) {
        this.openmct = openmct;
        this.key = CHANNEL_TABLE_SET_VIEW_KEY;
        this.name = `${CHANNEL_TABLE_SET_NAME} View`;
        this.cssClass = CHANNEL_TABLE_SET_ICON;
    }

    canView(domainObject) {
        return domainObject.type === CHANNEL_TABLE_SET_KEY;
    }

    view(domainObject, objectPath) {
        return new ChannelTableSetView(openmct, domainObject, objectPath);        
    }

    canEdit(domainObject) {
        return domainObject.type === CHANNEL_TABLE_SET_KEY;
    }

    priority() {
        return this.openmct.priority.HIGH;
    }
}
