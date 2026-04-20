function extend(props) {
  const parent = this;
  let child;
  let Surrogate;

  if (props && Object.hasOwn(props, 'constructor')) {
    child = props.constructor;
  } else {
    child = function () {
      return parent.apply(this, arguments);
    };
  }

  Object.keys(parent).forEach((propKey) => {
    child[propKey] = parent[propKey];
  });

  // Surrogate allows inheriting from parent without invoking constructor.
  Surrogate = function () {
    this.constructor = child;
  };
  Surrogate.prototype = parent.prototype;
  child.prototype = new Surrogate();

  if (props) {
    Object.keys(props).forEach((key) => {
      child.prototype[key] = props[key];
    });
  }

  child.__super__ = parent.prototype;

  return child;
}

export default extend;
