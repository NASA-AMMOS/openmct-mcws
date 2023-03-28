define([
    './VISTAType'
], function (
    VISTAType
) {
    const NAME_MAP = {
        'ground_status': 'Status',
        'product_type': 'Type',
        'unique_name': 'File Name',
        'total_parts': '# of Parts'
    }

    function fullyQualifiedURL(url, mcwsRootURL) {
        if (url.startsWith('/')) {
            if (!mcwsRootURL) {
                console.error('No MCWS Root URL, Data Product downloads will fail');
            }

            return mcwsRootURL + url;
        } else {
            return url;
        }
    }

    /**
     * Represents a Data Products node.
     *
     * Id format: "vista:products:<dataset_id>"
     */
    var DataProductsType = new VISTAType({
        key: "vista.dataProducts",
        name: "Data Products",
        cssClass: "icon-telemetry",
        pattern: /^products:([a-zA-Z0-9\-:]+)/,
        transform: function (match) {
            return {
                datasetIdentifier: VISTAType.toIdentifier(match[1])
            };
        },
        makeId: function (datasetIdentifier) {
            return "products:" + VISTAType.toKeyString(datasetIdentifier);
        },
        makeObject: function (dataset, data) {
            return Promise.resolve({
                name: "Data Products",
                type: this.key,
                location: this.getLocation(dataset, data),
                telemetry: {
                    dataProductUrl: dataset.options.dataProductUrl,
                    dataProductContentUrl: fullyQualifiedURL(dataset.options.dataProductContentUrl, dataset.options.mcwsRootUrl),
                    dataProductStreamUrl: dataset.options.dataProductStreamUrl,
                    mcwsVersion: dataset.version,
                    values: [{
                        key: "dat_url",
                        name: "Download .DAT",
                        format: "url",
                        hints: {
                            range: 1
                        }
                    }, {
                        key: "emd_url",
                        name: "Download .EMD",
                        format: "url",
                        hints: {
                            range: 2
                        }
                    }, {
                        key: "emd_preview",
                        name: "Preview .EMD",
                        format: "url",
                        hints: {
                            range: 3
                        }
                    }, {
                        key: "txt_url",
                        name: "Download .TXT",
                        format: "url",
                        hints: {
                            range: 4
                        }
                    }, {
                        key: "creation_time",
                        name: "Creation Time",
                        format: window.openmctMCWSConfig.time.utcFormat
                    },{
                        key: "parts_received",
                        name: "# Received",
                        hints: {
                            range: 5
                        }
                    },{
                        key: "total_parts",
                        name: "# Parts",
                        hints: {
                            range: 6
                        }
                    }].concat([
                        "record_type",
                        "session_id",
                        "session_host",
                        "vcid",
                        "apid",
                        "product_type",
                        "command_number",
                        "dvt_coarse",
                        "dvt_fine",
                        "seq_id",
                        "seq_version",
                        "transaction_id",
                        "file_size",
                        "checksum",
                        "ground_status",
                        "unique_name",
                        "version"
                    ].map(function (key, index) {
                        return {
                            key: key,
                            name: NAME_MAP[key] || _.startCase(key),
                            format: 'string',
                            hints: {
                                range: index + 7
                            }
                        };
                    }))
                }
            });
        }
    });

    return DataProductsType;

});
