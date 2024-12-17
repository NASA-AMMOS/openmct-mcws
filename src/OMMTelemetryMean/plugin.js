/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define(['./src/OMMMeanTelemetryProvider'], function (OMMMeanTelemetryProvider) {
    const DEFAULT_SAMPLES = 10;
    // Form dropdown defaults are set by matching value, so...the default must match.
    const DEFAULT_RANGE = {"key": "dn", "name":"DN", "hints": {"range": 1, "priority": 1}};
    function plugin() {
        return function install(openmct) {
            openmct.types.addType('telemetry-mean', {
                name: 'OMM Telemetry Mean',
                description: 'Provides telemetry values that represent the mean of the last N values of a telemetry stream',
                creatable: true,
                cssClass: 'icon-telemetry',
                initialize: function (domainObject) {
                    domainObject.telemetryPoint= 'vista:channel:shared-shared:d2e7fe9b-ce12-439f-86af-c18667460029:S-3118';
                    domainObject.samples = DEFAULT_SAMPLES;
                    domainObject.rangeidx = openmct.time.getAllTimeSystems().filter(ts => ts.key !== 'utc').length;
                    domainObject.telemetry = {};
                    domainObject.telemetry.values =
                        openmct.time.getAllTimeSystems().filter(ts => ts.key !== 'utc').map(function (timeSystem, index) { 
                            var newTimeSystem={};
                            Object.keys(timeSystem).forEach(key => newTimeSystem[key]=timeSystem[key]);
                            newTimeSystem['hints']={
                                    domain: index,
                                    priority: index
                                };
                            return newTimeSystem;
                        });
                    domainObject.telemetry.values[openmct.time.getAllTimeSystems().filter(ts => ts.key !== 'utc').length]=DEFAULT_RANGE;
                }, 
                form: [
                    {
                        "key": "telemetryPoint",
                        "name": "Telemetry Point",
                        "control": "textfield",
                        "required": true,
                        "cssClass": "l-input-lg"
                    },
                    {
                        "key": "samples",
                        "name": "Samples to Average",
                        "control": "textfield",
                        "required": true,
                        "cssClass": "l-input-sm"
                    },        
                    {
                        
                        "name": "Configured Y-axis",
                        "control": 'select',
                        "options": [
                          {
                            "name": 'DN',
                            "value": {"key": "dn", "name":"DN", "hints": {"range": 1, "priority": 1}}
                          },
                          {
                            "name": 'EU',
                            "value": {"key": "eu", "name":"EU", "hints": {"range": 1, "priority": 1}}
                          }
                        ],
                        "cssClass": 'l-inline',
                        "property": ['telemetry', 'values',openmct.time.getAllTimeSystems().filter(ts => ts.key !== 'utc').length+1],

                      }
                ]
            });
            openmct.telemetry.addProvider(new OMMMeanTelemetryProvider(openmct));
        };
        
    }

    return plugin;
});
