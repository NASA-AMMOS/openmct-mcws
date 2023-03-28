define([
    'services/mcws/mcws',
    'services/session/SessionService',
    'lodash',
    'openmct'
], function (
    mcwsDefault,
    sessionServiceDefault,
    _,
    openmct
) {
    const mcws = mcwsDefault.default;;

    function EVRDictionary(dataset) {
        this.dataset = dataset;
        this.sessions = sessionServiceDefault.default();
        this.loadOnSessionChange = this.loadOnSessionChange.bind(this);

        this.sessions.listen(this.loadOnSessionChange);
    }

    EVRDictionary.prototype.load = function () {
        if (this.loaded) {
            return Promise.resolve();
        }
        if (this.loading) {
            return this.loading;
        }

        var evrDictionaryUrl = this.dataset.getActiveEvrDictionaryUrl();

        return this.loading = this.dataset.load()
            .then(function () {
                return mcws
                    .dataTable(evrDictionaryUrl)
                    .read()
                    .then(function (evrs) {
                        var grouped = _.groupBy(_.sortBy(evrs, 'evr_name'), 'module');
                        this.byModule = {};
                        _.forEach(grouped, function (evrGroup, module) {
                            this.byModule[module] = _.map(evrGroup, 'evr_name');
                        }.bind(this));
                        this.modules = _.sortBy(_.keys(this.byModule));
                        this.byName = _.keyBy(evrs, 'evr_name');
                        this.levels = _.map(_.uniqBy(evrs, 'level'), 'level');
                        this.loaded = true;
                    }.bind(this));
            }.bind(this));
    };

    EVRDictionary.prototype.loadOnSessionChange = function (session) {
        if (session) {
            this.loading = false;
            this.loaded = false;
            this.load();
        }
    };

    EVRDictionary.prototype.getLevels = function () {
        return this.load()
            .then(function () {
                return this.levels;
            }.bind(this));
    };

    EVRDictionary.prototype.getModules = function () {
        return this.load()
            .then(function () {
                return this.modules;
            }.bind(this))
    };

    EVRDictionary.prototype.getModuleEVRs = function (module) {
        return this.load()
            .then(function () {
                return this.byModule[module];
            }.bind(this))
    }

    return EVRDictionary;
});
