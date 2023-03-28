define([
    './injectEVRStylesheet',
    '../types/types'
], function (
    injectEVRStylesheet,
    types
) {

    var EVR_TYPES = [
        types.EVR,
        types.EVRModule,
        types.EVRSource
    ];

    /**
     * EVR Highlight Provider.
     * Provides a limit evaluator for any EVR telemetry object which applies
     * css classes based on the level of the EVR message.
     */
    function EVRHighlightProvider(definitions) {
        this.definitions = definitions;
        injectEVRStylesheet(definitions);
        this.levelCache = {};
        this.evaluator = {
            evaluate: function (datum, valueMetadata, levels) {
                const level = datum.level;

                if (!level) {
                    return;
                }

                if (levels && !levels.includes(level)) {
                    return;
                }

                return this.getLimitStateForLevel(level);
            }.bind(this)
        };
    }

    /**
     * Check if this provider can evaluate limits for a given object.  Returns
     * true for any EVR type object.
     *
     * @param domainObject the domain object to check for support.
     * @returns Boolean
     */
    EVRHighlightProvider.prototype.supportsLimits = function (domainObject) {
        if (!types.hasTypeForKey(domainObject.type)) {
            return false;
        }
        var vistaType = types.typeForKey(domainObject.type);
        return EVR_TYPES.indexOf(vistaType) !== -1;
    };

    /**
     * Get an evaluator.  Returns the same evaluator for all domain objects.
     */
    EVRHighlightProvider.prototype.getLimitEvaluator = function (domainObject) {
        return this.evaluator;
    };

    /**
     * Get the limit state for a given level.  Checks for state in cache, makes
     * a new state if one isn't found.
     * @private
     */
    EVRHighlightProvider.prototype.getLimitStateForLevel = function (level) {
        if (!this.levelCache.hasOwnProperty(level)) {
            this.levelCache[level] = this.makeLimitStateForLevel(level);
        }
        return this.levelCache[level];
    };

    /**
     * Make the limit state for a given level.  If there is no matching rules,
     * return undefined.
     * @private
     */
    EVRHighlightProvider.prototype.makeLimitStateForLevel = function (level) {
        var classes = [];
        if (this.definitions.evrBackgroundColorByLevel.hasOwnProperty(level)) {
            classes.push('vista-evr-level-bg-' + level.toLowerCase());
        } else if (this.definitions.evrDefaultBackgroundColor) {
            classes.push('vista-evr-default-bg');
        }
        if (this.definitions.evrForegroundColorByLevel.hasOwnProperty(level)) {
            classes.push('vista-evr-level-fg-' + level.toLowerCase());
        } else if (this.definitions.evrDefaultForegroundColor) {
            classes.push('vista-evr-default-fg');
        }
        if (classes.length > 0) {
            return {
                cssClass: classes.join(' ')
            };
        }
        return undefined;
    };

    return EVRHighlightProvider;
});
