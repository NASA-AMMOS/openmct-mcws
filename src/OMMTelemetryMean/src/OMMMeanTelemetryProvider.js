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

define([
    'objectUtils',
    './TelemetryAverager'
], function (objectUtils, TelemetryAverager) {

    function OMMMeanTelemetryProvider(openmct) {
        this.openmct = openmct;
        this.telemetryAPI = openmct.telemetry;
        this.timeAPI = openmct.time;
        this.objectAPI = openmct.objects;
        this.perObjectProviders = {};
    }
    OMMMeanTelemetryProvider.prototype.canProvideTelemetry = function (domainObject) {
        return domainObject.type === 'telemetry-mean';
    };

    OMMMeanTelemetryProvider.prototype.supportsRequest =
        OMMMeanTelemetryProvider.prototype.supportsSubscribe =
            OMMMeanTelemetryProvider.prototype.canProvideTelemetry;

    OMMMeanTelemetryProvider.prototype.subscribe = function (domainObject, callback) {
        let wrappedUnsubscribe;
        let unsubscribeCalled = false;
        const objectId = objectUtils.parseKeyString(domainObject.telemetryPoint);
        const samples = domainObject.samples;
        const rangeidx = domainObject.rangeidx;
        const domainValues = domainObject.telemetry.values;
        this.objectAPI.get(objectId)
            .then(function (linkedDomainObject) {
                if (!unsubscribeCalled) {
                    
                    wrappedUnsubscribe = this.subscribeToAverage(linkedDomainObject, samples, domainValues, rangeidx, callback);
                }
            }.bind(this))
            .catch(logError);

        return function unsubscribe() {
            unsubscribeCalled = true;
            if (wrappedUnsubscribe !== undefined) {
                wrappedUnsubscribe();
            }
        };
    };

    OMMMeanTelemetryProvider.prototype.subscribeToAverage = function (domainObject, samples, domainValues,rangeidx,callback) {
        const telemetryAverager = new TelemetryAverager(this.telemetryAPI, this.timeAPI, domainObject, samples,domainValues,rangeidx, callback);
        const createAverageDatum = telemetryAverager.createAverageDatum.bind(telemetryAverager);

        return this.telemetryAPI.subscribe(domainObject, createAverageDatum);
    };

    OMMMeanTelemetryProvider.prototype.request = function (domainObject, request) {
        const objectId = objectUtils.parseKeyString(domainObject.telemetryPoint);
        const samples = domainObject.samples;
        const rangeidx = domainObject.rangeidx;
        const domainValues = domainObject.telemetry.values;
        // Must clear the plot object because every query requires a re-calculate to be accurate. 
        openmct.objectViews.emit('clearData',domainObject);
        return this.objectAPI.get(objectId).then(function (linkedDomainObject) {
            return this.requestAverageTelemetry(linkedDomainObject, request, samples, domainValues, rangeidx);
        }.bind(this));
    };

    /**
     * @private
     */
    OMMMeanTelemetryProvider.prototype.requestAverageTelemetry = function (domainObject, request, samples, domainValues,rangeidx) {
        const averageData = [];
        const addToAverageData = averageData.push.bind(averageData);
        const telemetryAverager = new TelemetryAverager(this.telemetryAPI, this.timeAPI, domainObject, samples, domainValues, rangeidx, addToAverageData);
        const createAverageDatum = telemetryAverager.createAverageDatum.bind(telemetryAverager);
        const timeAPI=this.timeAPI;

        return this.telemetryAPI.request(domainObject, request).then(function (telemetryData) {
            // Need to ensure the data is sorted by the current domain. 
            // Especially needed because during realtime passes telemetry fills in from behind
            // So each update of this isn't guarenteed to have time-sorted telemetry in pass. 
            const domainKey = timeAPI.timeSystem().key;
            telemetryData.sort((a, b) => a[domainKey] - b[domainKey]); 
            telemetryData.forEach(createAverageDatum);
            return averageData;
        });
    };

    /**
     * @private
     */
    OMMMeanTelemetryProvider.prototype.getLinkedObject = function (domainObject) {
        const objectId = objectUtils.parseKeyString(domainObject.telemetryPoint);

        return this.objectAPI.get(objectId);
    };

    function logError(error) {
        if (error.stack) {
            console.error(error.stack);
        } else {
            console.error(error);
        }
    }

    return OMMMeanTelemetryProvider;
});
