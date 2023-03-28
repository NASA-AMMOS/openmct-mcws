define(["lodash"], function (_) {
    /**
     * Allows data product content to be previewed in browser, when it can
     * be interpreted. Implementations of this interface may be registered
     * by missions to allow additional types of data products to be
     * recognized and previewed.
     *
     * The `datum` objects passed to a DataProductViewProvider are
     * JavaScript objects with the same properties as appear as columns
     * in a DataProduct virtual data table, with additional `dat_url` and
     * `emd_url` properties providing URLs to retrieve the associated
     * .dat and .emd files, respectively.
     *
     * The `fileType` parameter is a string indicating the file extension
     * of the associated data product content; one of ".emd" or ".dat"
     *
     * @interface DataProductViewProvider
     */

    /**
     * Check if this provider can provide a preview of associated
     * data product content.
     * @memberof DataProductViewProvider#
     * @method appliesTo
     * @param {object} datum a row from a DataProduct virtual data table
     * @param {string} fileType the file extension, broadly indicating type
     * @returns {boolean} true if the related data product content can be
     *                    previewed
     */

    /**
     * Display a preview of data product content.
     * @memberof DataProductViewProvider#
     * @method view
     * @param {object} datum a row from a DataProduct virtual data table
     * @param {string} fileType the file extension, broadly indicating type
     * @param {HTMLElement} domElement the element in which to display
     *        a preview of the data product content
     */


    /**
     * Aggregator for DataProductViewProviders.
     * @param {DataProductViewProvider[]} providers providers to aggregate
     * @constructor
     * @implements {DataProductViewProvider}
     */
    function DataProductViewAggregator(providers) {
        this.providers = providers;
    }

    DataProductViewAggregator.prototype.appliesTo = function (datum, fileType) {
        return this.providers.some(function (provider) {
            return provider.appliesTo(datum, fileType);
        });
    };

    DataProductViewAggregator.prototype.view = function (datum, fileType, domElement) {
        var provider = _.find(this.providers, function (provider) {
            return provider.appliesTo(datum, fileType);
        });

        if (provider) {
            provider.view(datum, fileType, domElement);
        } else {
            throw new Error("No applicable viewer.");
        }
    };

    return DataProductViewAggregator;
});
