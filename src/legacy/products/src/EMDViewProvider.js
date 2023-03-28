define([
    'services/mcws/mcws'
], function (
    mcwsDefault
) {

    const mcws = mcwsDefault.default;

    /**
     * Provides plain-text previews of XML .emd data product content.
     * @param {DataProductViewProvider[]} providers providers to aggregate
     * @constructor
     * @implements {DataProductViewProvider}
     */
    function EMDViewProvider($document) {
        this.$document = $document;
    }

    EMDViewProvider.prototype.appliesTo = function (row, fileType) {
        return fileType === '.emd' && row.emd_preview;
    };

    EMDViewProvider.prototype.view = function (row, fileType, el) {
        var $document = this.$document;
        var divElement = $document[0].createElement('div');
        divElement.className = "abs loading";
        el.appendChild(divElement);

        mcws.opaqueFile(row.emd_preview).read().then(function (response) {
            var preElement = $document[0].createElement('pre');
            var codeElement = $document[0].createElement('code');
            preElement.appendChild(codeElement);
            divElement.className = "abs scroll";
            codeElement.textContent = response;
            divElement.appendChild(preElement);
        }, function (response) {
            let reason = 'Unknown Error';
            if (response && response.data && response.data.description) {
                reason = response.data.description
            }
            divElement.className = "abs scroll";
            divElement.textContent = [
                "Failed to load data product content from ",
                row.emd_preview,
                ' due to: "',
                reason,
                '"'
            ].join('');
        });
    };

    return EMDViewProvider;
});
