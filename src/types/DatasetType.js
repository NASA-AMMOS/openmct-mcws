define([
    './VISTAType'
], function (
    VISTAType
) {

    return new VISTAType({
        key: "vista.dataset",
        name: "Data Set",
        description: "Combine one or more data sources such as historical, " +
            "streaming, LAD or MinMax into a unified collection. Once added, " +
            "sources become available in the Data Set folder as Channel and " +
            "Event Record objects which can be viewed directly or used in " +
            "Plots, Channel Tables and Display Layouts.",
        creatable: "true",
        cssClass: "icon-dataset",
        initialize: function (domainObject) {
            domainObject.version = 1;
            domainObject.composition = [];
            return domainObject;
        },
        form: [
            {
                name: "Dataset Prefix",
                key: "prefix",
                control: "textfield",
                cssClass: "l-input-lg"
            },
            {
                name: "MCWS Root URL",
                key: "mcwsRootUrl",
                control: "textfield",
                cssClass: "l-input-lg"
            },
            {
                name: "Channel Dictionary URL",
                key: "channelDictionaryUrl",
                control: "textfield",
                cssClass: "l-input-lg"
            },
            {
                name: "Channel Enumeration Dictionary URL",
                key: "channelEnumerationDictionaryUrl",
                control: "textfield",
                cssClass: "l-input-lg"
            },
            {
                name: "Channel Historical URL",
                key: "channelHistoricalUrl",
                control: "textfield",
                cssClass: "l-input-lg"
            },
            {
                name: "Channel MinMax URL",
                key: "channelMinMaxUrl",
                control: "textfield",
                cssClass: "l-input-lg"
            },
            {
                name: "Channel LAD URL",
                key: "channelLADUrl",
                control: "textfield",
                cssClass: "l-input-lg"
            },
            {
                name: "Channel Stream URL",
                key: "channelStreamUrl",
                control: "textfield",
                cssClass: "l-input-lg"
            },
            {
                name: "Channel Stream Header Channels",
                key: "headerChannels",
                description: "Enter header channel ids separated by commas",
                control: "textarea",
                cssClass: "l-textarea-sm"
            },
            {
                name: "Session URL",
                key: "sessionUrl",
                control: "textfield",
                cssClass: "l-input-lg"
            },
            {
                name: "Session LAD URL",
                key: "sessionLADUrl",
                control: "textfield",
                cssClass: "l-input-lg"
            },
            {
                name: "Event Record Dictionary URL",
                key: "eventRecordDictionaryUrl",
                control: "textfield",
                cssClass: "l-input-lg"
            },
            {
                name: "EVR Historical URL",
                key: "evrHistoricalUrl",
                control: "textfield",
                cssClass: "l-input-lg"
            },
            {
                name: "EVR LAD URL",
                key: "evrLADUrl",
                control: "textfield",
                cssClass: "l-input-lg"
            },
            {
                name: "EVR Stream URL",
                key: "evrStreamUrl",
                control: "textfield",
                cssClass: "l-input-lg"
            },
            {
                name: "Data Product URL",
                key: "dataProductUrl",
                control: "textfield",
                cssClass: "l-input-lg"
            },
            {
                name: "Data Product Content URL",
                key: "dataProductContentUrl",
                control: "textfield",
                cssClass: "l-input-lg"
            },
            {
                name: "Data Product Stream URL",
                key: "dataProductStreamUrl",
                control: "textfield",
                cssClass: "l-input-lg"
            },
            {
                name: "Packet URL",
                key: "packetUrl",
                control: "textfield",
                cssClass: "l-input-lg"
            },
            {
                name: "Packet Content URL",
                key: "packetContentUrl",
                control: "textfield",
                cssClass: "l-input-lg"
            },
            {
                name: "Packet Summary Event Stream URL",
                key: "packetSummaryEventStreamUrl",
                control: "textfield",
                cssClass: "l-input-lg"
            },
            {
                name: "Command Event Historical URL",
                key: "commandEventUrl",
                control: "textfield",
                cssClass: "l-input-lg"
            },
            {
                name: "Command Event Stream URL",
                key: "commandEventStreamUrl",
                control: "textfield",
                cssClass: "l-input-lg"
            },
            {
                name: "Message Stream URL",
                key: "messageStreamUrl",
                control: "textfield",
                cssClass: "l-input-lg"
            },
            {
                name: "Frame Summary Stream URL",
                key: "frameSummaryStreamUrl",
                control: "textfield",
                cssClass: "l-input-lg"
            },
            {
                name: "Frame Event Stream URL",
                key: "frameEventStreamUrl",
                control: "textfield",
                cssClass: "l-input-lg"
            },
            {
                name: "Alarm Message Stream URL",
                key: "alarmMessageStreamUrl",
                control: "textfield",
                cssClass: "l-input-lg"
            }
        ]
    });

});
