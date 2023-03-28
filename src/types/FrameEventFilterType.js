define([
    './VISTAType'
], function (
    VISTAType
) {
    var FrameEventFilterType = new VISTAType({
        key: "vista.frame-event-filter",
        name: "Frame Event Type",
        cssClass: "icon-telemetry",
        pattern: /^frame-event-filter:([a-zA-Z0-9\-:]+)/,
        transform: function (match) {
            return {
                datasetIdentifier: VISTAType.toIdentifier(match[1])
            };
        },
        makeId: function (datasetIdentifier) {
            return "frame-event-filter:" + VISTAType.toKeyString(datasetIdentifier);
        }
    });

    return FrameEventFilterType;
});
