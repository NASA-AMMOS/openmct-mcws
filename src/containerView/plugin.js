import FolderGridViewProvider from './FolderGridViewProvider.js';
import FolderListViewProvider from './FolderListViewProvider.js';
import BlankViewProvider from './BlankViewProvider.js';

const FOLDER_CONTAINER_TYPES = ['vista.dictionarySource'];

const BLANK_CONTAINER_TYPES = [
  'vista.dataset',
  'vista.channel.alarms',
  'vista.channelSource',
  'vista.channelGroup',
  'vista.headerChannelSource'
];

/**
 * Adds the folder views to container type objects without defined views/telemetry.
 */
export default function ContainerViewPlugin() {
  return function install(openmct) {
    openmct.objectViews.addProvider(new FolderGridViewProvider(openmct, FOLDER_CONTAINER_TYPES));
    openmct.objectViews.addProvider(new FolderListViewProvider(openmct, FOLDER_CONTAINER_TYPES));
    openmct.objectViews.addProvider(new BlankViewProvider(openmct, BLANK_CONTAINER_TYPES));
  };
}
