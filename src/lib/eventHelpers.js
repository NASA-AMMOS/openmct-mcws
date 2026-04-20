const helperFunctions = {
  listenTo(object, event, callback, context) {
    if (!this._listeningTo) {
      this._listeningTo = [];
    }

    const listener = {
      object: object,
      event: event,
      callback: callback,
      context: context,
      _cb: context ? callback.bind(context) : callback
    };

    if (object.$watch && event.startsWith('change:')) {
      const scopePath = event.replace('change:', '');
      listener.unlisten = object.$watch(scopePath, listener._cb, true);
    } else if (object.$on) {
      listener.unlisten = object.$on(event, listener._cb);
    } else {
      object.on(event, listener._cb);
    }

    this._listeningTo.push(listener);
  },

  stopListening(object, event, callback, context) {
    if (!this._listeningTo) {
      this._listeningTo = [];
    }

    this._listeningTo
      .filter((listener) => {
        if (object && object !== listener.object) {
          return false;
        }
        if (event && event !== listener.event) {
          return false;
        }
        if (callback && callback !== listener.callback) {
          return false;
        }
        if (context && context !== listener.context) {
          return false;
        }

        return true;
      })
      .map((listener) => {
        if (listener.unlisten) {
          listener.unlisten();
        } else {
          listener.object.off(listener.event, listener._cb);
        }

        return listener;
      })
      .forEach((listener) => {
        this._listeningTo.splice(this._listeningTo.indexOf(listener), 1);
      });
  },

  extend(object) {
    object.listenTo = helperFunctions.listenTo;
    object.stopListening = helperFunctions.stopListening;
  }
};

export default helperFunctions;
