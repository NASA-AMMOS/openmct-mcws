define(['./MCWSURLBuilder'], function (MCWSURLBuilder) {
    'use strict';


    var FILTER_SUFFIX = "Filter";
    var FILTER_OPTIONS = ['spsc', 'apid', 'vcid'];
    var SORT_OPTIONS =
        ['session_id', 'rct', 'scet', 'ert', 'sclk', 'apid', 'spsc', 'vcid', 'ls'];

    var MINIMUM_QUERY_MESSAGE =
        'One of "Query by Session" or "Bound to Time Conductor"' +
        ' must be selected in order to query for packet content.';
    var SESSION_ID_MESSAGE =
        'Must specify Session ID to query by session.';


    function PacketQueryController($scope, openmct) {
        var rows = {
                useSession: {
                    name: "Query by Session",
                    control: "checkbox",
                    key: "useSession"
                },
                sessionId: {
                    name: "Session ID",
                    control: "textfield",
                    key: "sessionId"
                },
                useTimeConductor: {
                    name: "Bound to Time Conductor",
                    control: "checkbox",
                    key: "useTimeConductor"
                },
                sortBy: {
                    name: "Sort by",
                    control: "select",
                    options: SORT_OPTIONS.map(function (option) {
                        return {
                            name: option,
                            value: option
                        };
                    }),
                    key: "sortBy"
                }
            },
            filterRows = [];

        function generateQueryUrl() {
            var domainObject = $scope.domainObject;
            var url = domainObject.getModel().telemetry.dataProductContentUrl;
            var builder = new MCWSURLBuilder(url);

            if ($scope.queryModel.useSession) {
                builder.filter('session_id', $scope.queryModel.sessionId);
            }

            if ($scope.queryModel.useTimeConductor) {
                let bounds = openmct.time.bounds();
                let start = bounds.start;
                let end = bounds.end;
                let timeSystem = openmct.time.timeSystem();
                let domain = timeSystem.key;

                let format = openmct.telemetry.getFormatter(timeSystem.timeFormat);

                builder.filter(domain, format.format(start), ">");
                builder.filter(domain, format.format(end), "<");
            }

            FILTER_OPTIONS.forEach(function (option) {
                var property = option + FILTER_SUFFIX;
                if ($scope.queryModel[property]) {
                    builder.filter(option, $scope.queryModel[property]);
                }
            });

            if ($scope.queryModel.sortBy) {
                builder.sort($scope.queryModel.sortBy);
            }

            $scope.queryUrl = builder.url();
        }

        $scope.queryModel = {
            useSession: true,
            sessionId: 1,
            useTimeConductor: false,
            sortBy: undefined
        };

        FILTER_OPTIONS.forEach(function (key) {
            var propertyName = key + FILTER_SUFFIX;
            $scope.queryModel[propertyName] = "";

            filterRows.push({
                name: key.toUpperCase(),
                key: propertyName,
                control: "textfield"
            });
        });

        $scope.queryStructure = {
            sections: [
                {
                    name: "Session Selection",
                    rows: [ rows.useSession, rows.sessionId ]
                },
                {
                    name: "Time Range",
                    rows: [ rows.useTimeConductor ]
                },
                {
                    name: "Additional Filters",
                    rows: filterRows
                },
                {
                    name: "Sorting",
                    rows: [ rows.sortBy ]
                }
            ]
        };

        $scope.$watch("queryModel.useSession", function (useSession) {
            rows.sessionId.cssClass = useSession ? "" : "disabled";
        });

        $scope.$watchCollection("queryModel", function (queryModel) {
            $scope.canSubmit = true;

            if ((!queryModel.useSession) && (!queryModel.useTimeConductor)) {
                $scope.canSubmit = false;
                $scope.validationMessage = MINIMUM_QUERY_MESSAGE;
            }

            if (queryModel.useSession && (!queryModel.sessionId)) {
                $scope.canSubmit = false;
                $scope.validationMessage = SESSION_ID_MESSAGE;
            }

            generateQueryUrl();
        });
    }

    return PacketQueryController;
});
