  /**
     * A type for representing different types of VISTA objects and allowing
     * similar operations (such as making ids) to be shared between different
     * sections of code.
     *
     * @param {Object} attrs attributes specific to the Type.  Will become
     * available as instance properties of the object.
     * @param {string} attrs.key type key registered with Open MCT.
     * @param {string} attrs.type type label registered with Open MCT.
     * @param {string} attrs.cssClass display class registered with Open MCT.
     * @param {RegExp} [attrs.pattern] a pattern for matching ids of this type.
     * @param {Function} [attrs.transform] A function that takes a RegExp match
     * object (received by matching `pattern`) and return an object containing
     * all identifying information in the id.
     * @param {Function} [attrs.makeId] A function that generates ids for this
     * type.  Should expect to take a parameter similar to that returned by
     * `transform`
     * @param {Function} [attrs.name] A function for generating names for
     * objects of this type.  Will receive `Dataset` and `data` parameters and
     * should return a name from that.
     * @param {Function} [attrs.location] A function that returns the identifier
     * for the parent object of a specific instance of this object type.
     */
class VISTAType {
  constructor(attrs) {
    Object.assign(this, attrs);
    if (!this.pattern) {
      // Default pattern that never matches (null object pattern)
      // Provides RegExp-like interface to prevent errors in test() method
      this.pattern = {
        test: () => false
      };
    }
  }

  /**
   * Determine if a given id is an instance of the given type.
   *
   * @param {String} id the id to test
   * @returns {Boolean} true if the id is an instance of this type.
   */
  test(identifier) {
    return this.pattern.test(identifier.key);
  }

  hasComposition() {
    return !!this.getComposition;
  }

  /**
   * Return the data contained within an id of this type.
   *
   * @param {String} id the id to extract data from.
   * @returns {Object} the data extracted from the id.
   */
  data(identifier) {
    return this.test(identifier) && this.transform(this.pattern.exec(identifier.key));
  }

  makeIdentifier() {
    return {
      key: this.makeId.apply(this, arguments),
      namespace: 'vista'
    };
  }

  getName(dataset, data) {
    return data.name || this.name;
  }

  getLocation(dataset, data) {
    return dataset.options.identifier;
  }

  makeObject(dataset, data) {
    return Promise.resolve({
      type: this.key,
      name: this.getName(dataset, data),
      location: this.getLocation(dataset, data)
    });
  }

  /**
   * Convert a key string to an identifier object.
   *
   * @param {string} keyString - The key string in format "namespace:key"
   * @returns {Object} An identifier object with namespace and key properties
   */
  static toIdentifier(keyString) {
    const identifierParts = keyString.split(':');
    return {
      namespace: identifierParts[0],
      key: identifierParts[1]
    };
  }

  /**
   * Convert an identifier object to a key string.
   *
   * @param {Object} identifier - An identifier object with namespace and key properties
   * @returns {string} The key string in format "namespace:key"
   */
  static toKeyString(identifier) {
    return [identifier.namespace, identifier.key].join(':');
  }
}

export default VISTAType;
