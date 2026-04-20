import MSLSOLFormat from './MSLSOLFormat.js';
import LMSTFormat from './LMSTFormat.js';
import SCLKFloat64Format from './SCLKFloat64Format.js';
import UTCDayOfYearFormat from './UTCDayOfYearFormat.js';
import UTCFormat from './UTCFormat.js';
import JSONStringFormat from './JSONStringFormat.js';

function FormatPlugin(options) {
  return function install(openmct) {
    openmct.telemetry.addFormat(new UTCDayOfYearFormat());
    openmct.telemetry.addFormat(new UTCFormat());
    openmct.telemetry.addFormat(new MSLSOLFormat());
    openmct.telemetry.addFormat(new LMSTFormat());
    openmct.telemetry.addFormat(new SCLKFloat64Format());
    openmct.telemetry.addFormat(new JSONStringFormat());
  };
}

export default FormatPlugin;
