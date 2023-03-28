define([
    './ERTTimeSystem',
    './SCETTimeSystem',
    './SCLKTimeSystem',
    './MSLSolTimeSystem',
    './LMSTTimeSystem',
    './UTCClock',
    './LADClock',
    '../formats/MSLSOLFormat',
    '../formats/LMSTFormat',
    'moment'
], function (
    ERTTimeSystem,
    SCETTimeSystem,
    SCLKTimeSystem,
    MSLSolTimeSystem,
    LMSTTimeSystem,
    UTCClock,
    LADClock,
    MSLSolFormat,
    LMSTFormat,
    moment
) {

    var SYSTEM_MAP = {
        ert: ERTTimeSystem,
        scet: SCETTimeSystem,
        sclk: SCLKTimeSystem,
        'msl.sol': MSLSolTimeSystem,
        lmst: LMSTTimeSystem
    };

    var TODAY_BOUNDS = {
        start: moment.utc().startOf('day').valueOf(),
        end: moment.utc().endOf('day').valueOf()
    };

    var solFormat = new MSLSolFormat();
    var lmstFormat = new LMSTFormat();
    var nowLST = solFormat.format(moment.utc());
    var sol = Number(/SOL-(\d+)M/.exec(nowLST)[1]);

    var BOUNDS_MAP = {
        ert: TODAY_BOUNDS,
        scet: TODAY_BOUNDS,
        sclk: {
            start: 1,
            end: 10000
        },
        'msl.sol': {
            start: solFormat.parse('SOL-' + sol),
            end: solFormat.parse('SOL-' + (sol + 1))
        },
        lmst: {
            start: lmstFormat.parse('SOL-' + sol),
            end: lmstFormat.parse('SOL-' + (sol + 1))
        }
    };

    function TimePlugin(options) {
        if (!options.timeSystems) {
            console.error('Please specify one or more time systems to enable.');
        }

        if (options.lmstEpoch) {
            var lmstFormatWithEpoch = new LMSTFormat(options.lmstEpoch);

            BOUNDS_MAP.lmst = {
                start: lmstFormatWithEpoch.parse('SOL-' + sol),
                end: lmstFormatWithEpoch.parse('SOL-' + (sol + 1))
            };
        }

        return function install (openmct) {
            install.ladClocks = {};
            install.timeSystems = options.timeSystems;
            let useUTCClock = false;
            let menuOptions = [];


            options.timeSystems.forEach(function (timeSystem) {
                const key = timeSystem.key || timeSystem;

                if (!SYSTEM_MAP[key]) {
                    console.error('Invalid timeSystem specified: ' + key);
                    return;
                }

                const system = new SYSTEM_MAP[key](options.utcFormat);
                openmct.time.addTimeSystem(system);

                const systemOptions = {
                    timeSystem: system.key,
                    bounds: BOUNDS_MAP[key]
                };

                if (timeSystem.presets) {
                    systemOptions.presets = timeSystem.presets;
                }
                if (timeSystem.limit) {
                    systemOptions.limit = timeSystem.limit;
                }
                if (options.records) {
                    systemOptions.records = options.records;
                }

                menuOptions.push(systemOptions);
                
                if (options.allowRealtime && system.isUTCBased) {
                    useUTCClock = true;
                    menuOptions.push({
                        timeSystem: system.key,
                        clock: 'utc.local',
                        clockOffsets: {
                            start: -30 * 60 * 1000,
                            end: 5 * 60 * 1000
                        }
                    });
                }
                if (options.allowLAD) {
                    var ladClock = new LADClock(key);
                    install.ladClocks[key] = ladClock;
                    openmct.time.addClock(ladClock);
                    menuOptions.push({
                        timeSystem: system.key,
                        clock: ladClock.key,
                        clockOffsets: {
                            start: -30 * 60 * 1000,
                            end: 5 * 60 * 1000
                        }
                    });
                }
            });
            if (options.defaultMode) {
                let matchingConfigIndex = menuOptions.findIndex(menuOption => 
                    menuOption.clock === options.defaultMode);

                if (matchingConfigIndex !== -1) {
                    let matchingConfig = menuOptions[matchingConfigIndex]; 
                    menuOptions.splice(matchingConfigIndex, 1);
                    menuOptions.unshift(matchingConfig);
                } else {
                    console.warn(`Default mode '${options.defaultMode}' specified in configuration could not be applied. 
                        Are LAD or realtime enabled? Does the defaultMode contain a typo?`);
                }
            }

            if (useUTCClock) {
                openmct.time.addClock(new UTCClock());
            }

            openmct.install(openmct.plugins.Conductor({
                menuOptions: menuOptions
            }));
        }
    }

    return TimePlugin;
});
