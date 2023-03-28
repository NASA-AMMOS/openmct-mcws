define([

], function (

) {

    function VenueDialogController($scope, venueService) {
        this.$scope = $scope;

        $scope.isActiveVenueSelect = true;

        $scope.isSelectedVenue = function (venue) {
            return $scope.selectedVenue === venue;
        };

        $scope.selectVenue = function (venue) {
            $scope.selectedVenue = venue;
            delete $scope.selectedSession;
        };

        $scope.isSelectedSession = function (session) {
            return $scope.selectedSession === session;
        };

        $scope.selectSession = function (session) {
            $scope.selectedSession = session;
        };

        $scope.canSubmit = function () {
            return $scope.isActiveVenueSelect ?
                $scope.selectedVenue && $scope.selectedSession :
                !!$scope.selectedSession;
        };

        $scope.submit = function () {
            $scope.ngModel.submit(
                $scope.isActiveVenueSelect,
                $scope.selectedSession,
                $scope.selectedVenue
            );
        };

        $scope.$watch('isActiveVenueSelect', function (isActive) {
            delete $scope.selectedSession;
            if (!isActive) {
                venueService.listVenues()
                    .then(function (venues) {
                        $scope.urlsForHistoricalSessions = venues.map(function (v) {
                            return v.model.sessionUrl
                        })
                        .filter(function (v) {
                            return !!v;
                        });
                        setTimeout(function () {
                            $scope.$apply();
                        });
                    });
            } else {
                delete $scope.urlsForHistoricalSessions;
            }
        });
    }

    return VenueDialogController;
});
