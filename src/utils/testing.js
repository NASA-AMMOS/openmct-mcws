import openmct from 'openmct';
import TimePlugin from 'src/plugins/time/plugin';

const DEFAULT_TIME_OPTIONS = {
  timeSystems: ['ert'],
  allowLAD: true,
  allowRealtime: true,
  defaultMode: 'fixed',
  utcFormat: 'utc.day-of-year',
  records: 10
};

export function createOpenMct(timeOptions = DEFAULT_TIME_OPTIONS) {
  openmct.install(LegacySupport.default());

  openmct.install(openmct.plugins.LocalStorage());
  openmct.install(openmct.plugins.UTCTimeSystem());
  openmct.install(new TimePlugin(timeOptions));
  openmct.setAssetPath('/base');

  return openmct;
}

export function spyOnBuiltins(functionNames, object = window) {
  functionNames.forEach((functionName) => {
    if (nativeFunctions[functionName]) {
      throw `Builtin spy function already defined for ${functionName}`;
    }

    nativeFunctions.push({
      functionName,
      object,
      nativeFunction: object[functionName]
    });
    spyOn(object, functionName);
  });
}

export function clearBuiltinSpies() {
  nativeFunctions.forEach(clearBuiltinSpy);
  nativeFunctions = [];
}

export function resetApplicationState(openmct) {
  let promise;

  clearBuiltinSpies();

  if (openmct !== undefined) {
    openmct.destroy();
  }

  if (window.location.hash !== '#' && window.location.hash !== '') {
    promise = new Promise((resolve, reject) => {
      window.addEventListener('hashchange', cleanup);
      window.location.hash = '#';

      function cleanup() {
        window.removeEventListener('hashchange', cleanup);
        resolve();
      }
    });
  } else {
    promise = Promise.resolve();
  }

  return promise;
}
