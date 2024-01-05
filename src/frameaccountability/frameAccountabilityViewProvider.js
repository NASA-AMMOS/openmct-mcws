import frameAccountability from './components/frameAccountability';
import BadFramesTelemetryTable from './BadFramesTelemetryTable';
import mount from 'utils/mountVueComponent';

const FLAG_COLORS = {
    'InSync': '#7FFF00',
    'OutOfSyncData': '#FFA500',
    'LossOfSync': '#FF0000',
    'FrameSequenceAnomaly': '#FFA500'
};

export default class FrameAccountabilityViewProvider {
    constructor(domainObject, openmct, expectedVcidList) {
        this.domainObject = domainObject;
        this.keystring = openmct.objects.makeKeyString(this.domainObject.identifier);
        this.openmct = openmct;
        this.table = this.instantiateBadFramesTable();
        this.expectedVcidList = expectedVcidList;
        this._destroy = null;
    }
    instantiateBadFramesTable() {
        const domainObject = {
            identifier: {
                key: `bad-frames-${this.keystring}`,
                namespace: ''
            },
            name: 'Bad Frames Accountability',
            type: 'vista.frameEvent'
        };

        return new BadFramesTelemetryTable(domainObject, this.openmct);
    }
    show(element) {
        const componentDefinition = {
            components: {
                frameAccountability
            },
            provide: {
                openmct: this.openmct,
                domainObject: this.domainObject,
                table: this.table,
                objectPath: [],
                FLAG_COLORS,
                expectedVcidList: this.expectedVcidList,
                currentView: {}
            },
            template: '<frame-accountability></frame-accountability>'
        };
        
        const componentOptions = {
            element
        };
        
        const {
            componentInstance,
            destroy,
            el
        } = mount(componentDefinition, componentOptions);
        
        this._destroy = destroy;
    }
    destroy() {
        this._destroy?.();
        this.table.extendsDestroy();
    }
}
