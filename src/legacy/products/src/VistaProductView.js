define([], function () {
    function VISTAProductView(dataProductViewService) {
        function link(scope, element, attrs) {
            var datum = scope.$eval(attrs.datum);
            var fileType = scope.$eval(attrs.fileType);
            dataProductViewService.view(datum, fileType, element[0]);
        }

        return {
            restrict: "E",
            link: link
        };
    }

    return VISTAProductView;
});