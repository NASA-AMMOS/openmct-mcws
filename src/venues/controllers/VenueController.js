define([

], function (

) {

    function VenueController($scope) {
        $scope.venue = $scope.parameters.venue;
        $scope.isSelected = $scope.parameters.isSelected;
        $scope.selectVenue =$scope.parameters.selectVenue;

        var venue = $scope.venue;
        $scope.name = venue.model.name;
        $scope.isActive = false;
        $scope.isLoading = false;

        if (venue.allowsRealtime()) {
            $scope.isLoading = true;
            venue.getActiveSessions()
                .then(function (activeSessions) {
                    if (activeSessions.length) {
                        $scope.isActive = true;
                    }
                }, function (error) {
                    console.error('Error loading active sessions for Venue', venue);
                })
                .then(function () {
                    $scope.isLoading = false;
                    $scope.$apply();
                });
        }
    }

    return VenueController;
});
