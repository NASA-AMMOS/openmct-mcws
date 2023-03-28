define([
    './res/frameAccountabilityNode.html'
], function (
    vcidTemplate
) {
    const PAGE_THRESHOLD = 50;

    return {
        name: 'frame-accountability-node',
        template: vcidTemplate,
        inject: ['FLAG_COLORS'],
        props: ['title','iconClass', 'flagColor', 'children', 'finalChild', 'vcid', 'showBadFramesLink', 'unknownVCID'],
        data() {
            return {
                expanded: false,
                lazyLoadingIndex: 1
            };
        },
        computed: {
            maxChildren() {
                return PAGE_THRESHOLD * this.lazyLoadingIndex;
            },
            lazyLoadedChildren() {
                return this.children.slice(0, this.maxChildren);
            },
            numHiddenChildren() {
                if (this.children.length > this.maxChildren) {
                    return this.children.length - this.maxChildren;
                } else {
                    return 0;
                }
            }
        },
        methods: {
            toggleExpand() {
                if (this.expanded) {
                    this.lazyLoadingIndex = 1;
                }

                this.expanded = !this.expanded;
            },
            loadMore() {
               if (this.numHiddenChildren > 0) {
                   this.lazyLoadingIndex++;
               }
            },
            emitShowBadFrames() {
                this.$emit('show-bad-frames', this.vcid);
            }
        }
    };
});
