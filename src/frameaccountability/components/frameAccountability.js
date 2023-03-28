define([
    './res/frameAccountability.html',
    './frameAccountabilityNode',
    './frameAccountabilityBadFrames.vue',
    '../sortedEventsCollection',
    'saveAs'
], function (
    FrameAccountabilityTemplate,
    frameAccountabilityNode,
    frameAccountabilityBadFrames,
    SortedEventsCollection,
    saveAsObject
) {
    return {
        template: FrameAccountabilityTemplate,
        inject: ['openmct', 'domainObject', 'table', 'FLAG_COLORS', 'expectedVcidList'],
        components: {
            frameAccountabilityNode,
            frameAccountabilityBadFrames: frameAccountabilityBadFrames.default
        },
        data() {
            return {
                vcids: [],
                vcidsWithBadFrames: {},
                events: {},
                subscriptions: {},
                badFrames: [],
                sortedEventsCollections: {},
                vcid: undefined,
                frameEventValueMetadatas: undefined,
                commandEventValueMetadatas: undefined,
                unexpectedVcids: {}
            };
        },
        methods: {
            addEvents(domainObject) {
                if(domainObject.type === 'vista.frameEvent') {
                    this.addFrameEvents(domainObject);
                } else if (domainObject.type === 'vista.commandEvents') {
                    this.addCommandEvents(domainObject);
                }
            },
            removeEvents(identifier) {
                let keystring = this.openmct.objects.makeKeyString(identifier);

                if (this.subscriptions[keystring] && typeof this.subscriptions[keystring] === 'function') {
                    this.subscriptions[keystring]();
                    delete this.subscriptions[keystring];
                }
            },
            addCommandEvents(domainObject) {
                if (!this.commandEventMetadata || !this.commandEventFormats) {
                    this.commandEventMetadata = this.openmct.telemetry.getMetadata(domainObject);
                    this.commandEventFormats = this.openmct.telemetry.getFormatMap(this.commandEventMetadata);
                    this.commandEventValueMetadatas = this.commandEventMetadata.valueMetadatas;
                }

                let unsubscribe = this.openmct.telemetry.subscribe(domainObject, this.processRealtimeDatum('commandEvent'));
                let keystring = this.openmct.objects.makeKeyString(domainObject.identifier);

                this.subscriptions[keystring] = unsubscribe;
            },
            addFrameEvents(domainObject) {
                if (!this.frameEventMetadata || !this.frameEventFormats) {
                    this.frameEventMetadata = this.openmct.telemetry.getMetadata(domainObject);
                    this.frameEventFormats = this.openmct.telemetry.getFormatMap(this.frameEventMetadata);
                    this.frameEventValueMetadatas = this.frameEventMetadata.valueMetadatas;

                    this.table.metadata = this.frameEventValueMetadatas;
                    this.table.addColumnsForObject(domainObject);
                }

                let unsubscribe = this.openmct.telemetry.subscribe(domainObject, this.processRealtimeDatum('frameEvent'));
                let keystring = this.openmct.objects.makeKeyString(domainObject.identifier);

                this.subscriptions[keystring] = unsubscribe;
            },
            processRealtimeDatum(eventType) {
                return (datum) => {
                    let event = this.standardizeEvent(eventType, datum);

                    if (eventType === 'frameEvent') {
                        this.processFrameEvent(event);
                    } else if (eventType === 'commandEvent') {
                        this.processCommandEvent(event);
                    }
                };
            },
            standardizeEvent(eventType, datum) {
                let event = {type: eventType};

                this[`${eventType}ValueMetadatas`].forEach(valueMetadata => {
                    const key = valueMetadata.key;
                    const source = valueMetadata.source;

                    event[source] = this[`${eventType}Formats`][key].format(datum[source]);
                });

                return event;
            },
            processCommandEvent(commandEvent) {
                this.processVCID(commandEvent.vcid);
                this.addToSortedCollection(commandEvent);
            },
            processFrameEvent(frameEvent) {
                this.processVCID(frameEvent.vcid);

                if (frameEvent.message_type === 'BadTelemetryFrame') {
                    this.processBadTelemetryFrame(frameEvent);
                }

                this.addToSortedCollection(frameEvent);
            },
            processVCID(vcid) {
                if (!this.vcids.includes(vcid)) {
                    this.vcids.push(vcid);

                    if (!this.expectedVcidList.includes(Number(vcid))) {
                        this.unexpectedVcids[vcid] = true;
                    }
                }
            },
            processBadTelemetryFrame(frameEvent) {
                if (this.vcid && this.vcid === frameEvent.vcid) {
                    this.badFrames.push(frameEvent);
                }
                if (!this.vcidsWithBadFrames[frameEvent.vcid]) {
                    this.vcidsWithBadFrames[frameEvent.vcid] = true;
                }
            },
            addToSortedCollection(event) {
                const vcid = event.vcid;

                if (this.sortedEventsCollections[vcid] === undefined) {
                    this.createEventsCollection(vcid);
                }

                this.sortedEventsCollections[vcid].addRows([event]);
            },
            createEventsCollection(vcid) {
                const collection = new SortedEventsCollection.default();

                collection.on('add', this.updateFramesCollection(vcid));
                this.sortedEventsCollections[vcid] = collection;
            },
            updateFramesCollection(vcid) {
                return (datum) => {
                    let collection = this.sortedEventsCollections[vcid];

                    if (this.events[vcid]) {
                        this.$set(this.events, vcid, collection.getRows());
                    } else {
                        this.$set(this.events, vcid, [collection.getRows()]);
                    }
                };
            },
            lastChild(vcid) {
                let children = this.events[vcid];

                return children[children.length - 1];
            },
            hasBadFrames(vcid) {
                return this.vcidsWithBadFrames[vcid];
            },
            showBadFrames(vcid) {
                this.vcid = vcid;
                this.badFrames = this.events[this.vcid].filter((event) => {
                    return event.type === 'frameEvent' && event.message_type === 'BadTelemetryFrame';
                });
            },
            hideBadFrames() {
                this.vcid = undefined;
                this.badFrames = [];
            },
            exportAsText() {
                let textOutput = '';

                this.vcids.forEach(vcid => {
                    textOutput += 'VC-' + vcid + ' ' + 'Events' + '\n';

                    this.events[vcid].forEach((event, index, array) => {
                        if (event.type === 'frameEvent') {
                            textOutput += '\t' + event.event_time + ': ' + event.message_type + ' : Frame Event' +'\n';
                            textOutput += '\t\t' + event.summary + '\n';
                        } else if (event.type === 'commandEvent') {
                            textOutput += '\t' + event.event_time + ': ' + event.status +  ' : Command Event' + '\n';
                            textOutput += '\t\t' + event.status + '\n';
                        }

                        if (index === array.length - 1) {
                            textOutput += '\n';
                        }
                    });
                });

                let blob =  new Blob([textOutput], {type: "text"}),
                    filename = this.domainObject.name + '- Text Output';

                saveAsObject.saveAs(blob, filename);
            },
            isVcidUnexpected(vcid) {
                return true;
            }
        },
        mounted() {
            this.composition = this.openmct.composition.get(this.domainObject);
            this.composition.on('add', this.addEvents);
            this.composition.on('remove', this.removeEvents);
            this.composition.load();
        },
        destroyed() {
            this.composition.off('add', this.addEvents);
            this.composition.off('remove', this.removeEvents);

            Object.entries(this.sortedEventsCollections).forEach(([vcid, collection]) => {
                collection.off('add', this.updateFramesCollection(vcid));
                delete this.sortedEventsCollections[vcid];
            });

            Object.values(this.subscriptions).forEach(unsubscribe => {
                unsubscribe();
            });
        }
    };
});
