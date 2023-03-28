define([

], function (

) {
    function ActiveSessionSelectorController($scope) {
        var loadCounter = 0;
        $scope.isSelected = $scope.parameters.isSelected;
        $scope.selectSession = $scope.parameters.selectSession;
        function loadSessions(venue) {
            loadCounter++;
            var currentLoad = loadCounter;
            $scope.loading = true;
            delete $scope.error;
            delete $scope.topics;
            venue.getActiveSessions()
                .then(function (topics) {
                    if (currentLoad !== loadCounter) {
                        return;
                    }
                    if (!topics.length) {
                        return;
                    }
                    if (topics.length === 1 && topics[0].sessions.length === 1) {
                        $scope.selectSession(topics[0].sessions[0]);
                    }
                    $scope.topics = topics.map(function (t) {
                        return {
                            model: t,
                            expanded: t.sessions.some($scope.isSelected)
                        };
                    });
                }, function (error) {
                    if (currentLoad !== loadCounter) {
                        return;
                    }
                    $scope.error = error;
                    console.error('Error loading Sessions', error);
                })
                .then(function () {
                    if (currentLoad !== loadCounter) {
                        return;
                    }
                    $scope.loading = false;
                    $scope.$apply();
                })
        }
        $scope.$watch('parameters.venue', loadSessions);
    }

    return ActiveSessionSelectorController;
});
