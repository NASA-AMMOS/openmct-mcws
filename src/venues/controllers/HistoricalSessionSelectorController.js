/*global define*/

define([
    'lodash'
], function (
    _
) {
    'use strict';

    /**
     * Manages interactions between session selector and session service.
     *
     * @constructor
     */
    function HistoricalSessionSelectorController($scope, sessionService) {
        this.$scope = $scope;
        this.$scope.filter = {};
        this.$scope.sessions = [];
        this.$scope.currentSelection = $scope.parameters.session;
        this.sessionService = sessionService;
        this.applyFilter = this.applyFilter.bind(this);
        this.scheduleFilter = this.scheduleFilter.bind(this);
        this.$scope.$watchCollection('filter', this.scheduleFilter);
        this.loadSessions();

        this.$scope.isSelected = this.isSelected.bind(this);
        this.$scope.select = this.select.bind(this);
    }

    /**
     * Take a topic or session model and mark it as active.
     * @param {Object} viewmodel to select, could be topic or session.
     */
    HistoricalSessionSelectorController.prototype.select = function (session) {
        if (this.isSelected(session)) {
            this.$scope.currentSelection = undefined;
            this.$scope.parameters.selectSession(undefined);
        } else {
            this.$scope.currentSelection = session;
            this.$scope.parameters.selectSession(session);
        }
    };


    HistoricalSessionSelectorController.prototype.scheduleFilter = function (prev, curr) {
        if (prev === curr) {
            return;
        }
        if (this.filterTimeout) {
            clearTimeout(this.filterTimeout);
            delete this.filterTimeout;
        }
        this.filterTimeout = setTimeout(this.applyFilter, 250);
    };

    HistoricalSessionSelectorController.prototype.applyFilter = function () {
        delete this.filterTimeout;
        this.loadSessions();
        this.$scope.$digest();
    };

    HistoricalSessionSelectorController.prototype.getSessionKey = function (session) {
        return session.host + '_' + session.number;
    };

    HistoricalSessionSelectorController.prototype.isSelected = function (session) {
        return this.$scope.currentSelection ?
            this.getSessionKey(this.$scope.currentSelection) === this.getSessionKey(session) :
            false;
    };

    HistoricalSessionSelectorController.prototype.update = function () {
        setTimeout(function () {
            this.$scope.$digest();
        }.bind(this));
    };

    /**
     * Fetch
     */
    HistoricalSessionSelectorController.prototype.requestSessions = function () {
        if (Array.isArray(this.$scope.parameters.urls)) {
            return this.sessionService
                .getHistoricalSessions(this.$scope.filter, this.$scope.parameters.urls);
        }
        return this.sessionService
            .getHistoricalSessions(this.$scope.filter);
    };

    /**
     * Fetches sessions from the session service.
     * @private
     */
    HistoricalSessionSelectorController.prototype.loadSessions = function () {
        this.$scope.loading = true;
        this.$scope.sessions = [];
        var loadTracker = {};
        this.loadTracker = loadTracker;

        this.requestSessions()
            .then(_.bind(function (sessions) {
                if (loadTracker !== this.loadTracker) {
                    return;
                }
                this.$scope.sessions = sessions;
                this.$scope.loading = false;
                this.update();
            }, this), _.bind(function () {
                if (loadTracker !== this.loadTracker) {
                    return;
                }
                this.$scope.loading = false;
                this.update();
            }, this));
    };

    return HistoricalSessionSelectorController;
});
