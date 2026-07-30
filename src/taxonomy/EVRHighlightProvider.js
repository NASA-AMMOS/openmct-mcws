import injectEVRStylesheet from './injectEVRStylesheet.js';
import types from '../types/types.js';

const EVR_TYPES = [types.EVR, types.EVRModule, types.EVRSource];

/**
 * EVR Highlight Provider.
 * Provides a limit evaluator for any EVR telemetry object which applies
 * css classes based on the level of the EVR message.
 */
class EVRHighlightProvider {
  constructor(definitions) {
    this.definitions = definitions;
    injectEVRStylesheet(definitions);
    this.levelCache = {};
    this.evaluator = {
      evaluate: (datum, valueMetadata, levels) => {
        const level = datum.level;

        if (!level) {
          return;
        }

        if (levels && !levels.includes(level)) {
          return;
        }

        return this.getLimitStateForLevel(level);
      }
    };
  }

  /**
   * Check if this provider can evaluate limits for a given object.  Returns
   * true for any EVR type object.
   *
   * @param domainObject the domain object to check for support.
   * @returns Boolean
   */
  supportsLimits(domainObject) {
    if (!types.hasTypeForKey(domainObject.type)) {
      return false;
    }
    const vistaType = types.typeForKey(domainObject.type);
    return EVR_TYPES.includes(vistaType);
  }

  /**
   * Get an evaluator.  Returns the same evaluator for all domain objects.
   */
  getLimitEvaluator(domainObject) {
    return this.evaluator;
  }

  /**
   * Get the limit state for a given level.  Checks for state in cache, makes
   * a new state if one isn't found.
   * @private
   */
  getLimitStateForLevel(level) {
    if (!Object.hasOwn(this.levelCache, level)) {
      this.levelCache[level] = this.makeLimitStateForLevel(level);
    }
    return this.levelCache[level];
  }

  /**
   * Make the limit state for a given level.  If there is no matching rules,
   * return undefined.
   * @private
   */
  makeLimitStateForLevel(level) {
    const classes = [];
    if (this.definitions.evrBackgroundColorByLevel?.level) {
      classes.push('vista-evr-level-bg-' + level.toLowerCase());
    } else if (this.definitions.evrDefaultBackgroundColor) {
      classes.push('vista-evr-default-bg');
    }
    if (this.definitions.evrForegroundColorByLevel?.level) {
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
  }
}

export default EVRHighlightProvider;
