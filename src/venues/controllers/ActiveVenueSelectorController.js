define([

], function (

) {

    function ActiveVenueSelectorController($scope, venueService) {
        $scope.loading = true;
        venueService.listVenues()
            .then(function (venues) {
                $scope.venues = venues;
            }.bind(this), function (error) {
                console.error('error loading venues', error);
            })
            .then(function () {
                $scope.$apply();
                $scope.loading = false;
            });

        $scope.isSelected = $scope.parameters.isSelected;
        $scope.selectVenue = $scope.parameters.selectVenue;
    }

    return ActiveVenueSelectorController;
});
