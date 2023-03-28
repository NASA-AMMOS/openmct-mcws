/*global define,describe,beforeEach,it,expect*/

define([
    './DataProductRow'
], function (
    DataProductRow
) {
    'use strict';

    describe('The Data Product Row', function () {
        let dataProductRow;
        let columns;
        let objectKeyString;
        let limitEvaluator;
        let rowId;
        let startMessage;
        let partReceivedMessage;
        let completeMessage;

        beforeEach(function () {
            columns = [];
            objectKeyString = 'test-object';
            limitEvaluator = {
                evaluate: function () {return {}}
            };
            rowId = 'test-row-id';
            startMessage = {
                "transaction_id":"McamRThumbnail\/McamRThumbnail_0457586851-19880",
                "session_host":"host",
                "apid":"424",
                "total_parts":"0",
                "session_id":"36",
                "record_type":"product_started",
                "part_number":"0",
                "event_time":"2019-259T17:06:54.691",
                "vcid":"32"
            };
            partReceivedMessage = {
                "creation_time":"",
                "transaction_id":"McamRThumbnail\/McamRThumbnail_0457586851-19880",
                "dvt_coarse":"457586851",
                "ground_status":"UNKNOWN",
                "session_host":"host",
                "ert":"2019-259T17:06:54.590",
                "dvt_fine":"19880",
                "apid":"424",
                "total_parts":"0",
                "session_id":"36",
                "scet":"2014-183T15:39:04.687010296",
                "lst":"",
                "version":"",
                "file_size":"0",
                "record_type":"product_part_received",
                "command_number":"0",
                "unique_name":"products\/McamRThumbnail\/McamRThumbnail_0457586851-19880",
                "seq_version":"0",
                "checksum":"0",
                "part_number":"0",
                "sclk":"0457586851.30334",
                "seq_id":"0",
                "event_time":"2019-259T17:06:54.691",
                "vcid":"32"
            };
            completeMessage = {
                "creation_time":"2019-259T17:06:57.800",
                "transaction_id":"McamRThumbnail\/McamRThumbnail_0457586851-19880",
                "dvt_coarse":"457586851",
                "ground_status":"COMPLETE_CHECKSUM_PASS",
                "session_host":"host",
                "ert":"2019-259T17:06:54.590",
                "dvt_fine":"19880",
                "apid":"424",
                "total_parts":"20",
                "session_id":"36",
                "scet":"2014-183T15:39:04.687010296",
                "lst":"",
                "version":"",
                "file_size":"192819",
                "record_type":"complete_product",
                "command_number":"2",
                "unique_name":"complete_product_unique_name",
                "seq_version":"0",
                "checksum":"33862",
                "sclk":"0457586851.30334",
                "seq_id":"0",
                "event_time":"2019-259T17:06:54.691",
                "vcid":"32"
            }
        });

        it('Sets received parts to 0 when start message received', function () {
            dataProductRow = new DataProductRow(startMessage, columns, objectKeyString, limitEvaluator, rowId);
            expect(dataProductRow.datum.parts_received).toBe(0);
        });

        it('Increments part count when product part message received', function () {
            dataProductRow = new DataProductRow(startMessage, columns, objectKeyString, limitEvaluator, rowId);
            expect(dataProductRow.datum.parts_received).toBe(0);
            dataProductRow.update(partReceivedMessage);
            expect(dataProductRow.datum.parts_received).toBe(1);
        });

        it('Replaces content of in progress rows with info from new message', function () {
            const secondPartReceived = {
                "creation_time":"",
                "transaction_id":"McamRThumbnail\/McamRThumbnail_0457586851-19880",
                "dvt_coarse":"457586851",
                "ground_status":"UNKNOWN",
                "session_host":"host",
                "ert":"2019-259T17:06:54.590",
                "dvt_fine":"19880",
                "apid":"424",
                "total_parts":"0",
                "session_id":"36",
                "scet":"2014-183T15:39:04.687010296",
                "lst":"",
                "version":"",
                "file_size":"0",
                "record_type":"product_part_received",
                "command_number":"0",
                "unique_name":"a_different_unique_name",
                "seq_version":"0",
                "checksum":"1234",
                "part_number":"2",
                "sclk":"0457586851.30334",
                "seq_id":"0",
                "event_time":"2019-259T17:06:54.691",
                "vcid":"32"
            };

            dataProductRow = new DataProductRow(startMessage, columns, objectKeyString, limitEvaluator, rowId);

            dataProductRow.update(partReceivedMessage);
            expect(dataProductRow.datum["unique_name"]).toEqual("products\/McamRThumbnail\/McamRThumbnail_0457586851-19880");
            expect(dataProductRow.datum["checksum"]).toEqual("0");
            expect(dataProductRow.datum["part_number"]).toEqual("0");

            dataProductRow.update(secondPartReceived);
            expect(dataProductRow.datum["unique_name"]).toEqual("a_different_unique_name");
            expect(dataProductRow.datum["checksum"]).toEqual("1234");
            expect(dataProductRow.datum["part_number"]).toEqual("2");
            expect(false);
        });

        it('Does not replace content of complete rows with in progress rows', function () {
            dataProductRow = new DataProductRow(startMessage, columns, objectKeyString, limitEvaluator, rowId);
            dataProductRow.update(partReceivedMessage);
            expect(dataProductRow.datum["unique_name"]).toEqual("products\/McamRThumbnail\/McamRThumbnail_0457586851-19880");
            expect(dataProductRow.datum["checksum"]).toEqual("0");
            expect(dataProductRow.datum["part_number"]).toEqual("0");
            
            dataProductRow.update(completeMessage);
            expect(dataProductRow.datum["unique_name"]).toEqual("complete_product_unique_name");
            expect(dataProductRow.datum["checksum"]).toEqual("33862");
            expect(dataProductRow.datum["part_number"]).toBeUndefined();

            dataProductRow.update(partReceivedMessage);
            expect(dataProductRow.datum["unique_name"]).toEqual("complete_product_unique_name");
            expect(dataProductRow.datum["checksum"]).toEqual("33862");
            expect(dataProductRow.datum["part_number"]).toBeUndefined();
        });

        it('Does replace content of complete rows with complete rows', function () {
            const aDifferentCompleteMessage = {
                "creation_time":"2019-259T17:06:57.800",
                "transaction_id":"McamRThumbnail\/McamRThumbnail_0457586851-19880",
                "dvt_coarse":"457586851",
                "ground_status":"COMPLETE_CHECKSUM_PASS",
                "session_host":"host",
                "ert":"2019-259T17:06:54.590",
                "dvt_fine":"19880",
                "apid":"424",
                "total_parts":"20",
                "session_id":"36",
                "scet":"2014-183T15:39:04.687010296",
                "lst":"",
                "version":"",
                "file_size":"192819",
                "record_type":"complete_product",
                "command_number":"2",
                "unique_name":"a_different_complete_product_unique_name",
                "seq_version":"0",
                "checksum":"54321",
                "sclk":"0457586851.30334",
                "seq_id":"0",
                "event_time":"2019-259T17:07:57.800",
                "vcid":"32"
            }
            dataProductRow = new DataProductRow(startMessage, columns, objectKeyString, limitEvaluator, rowId);
            dataProductRow.update(partReceivedMessage);
            expect(dataProductRow.datum["unique_name"]).toEqual("products\/McamRThumbnail\/McamRThumbnail_0457586851-19880");
            expect(dataProductRow.datum["checksum"]).toEqual("0");
            expect(dataProductRow.datum["part_number"]).toEqual("0");
            
            dataProductRow.update(completeMessage);
            expect(dataProductRow.datum["unique_name"]).toEqual("complete_product_unique_name");
            expect(dataProductRow.datum["checksum"]).toEqual("33862");
            expect(dataProductRow.datum["event_time"]).toEqual("2019-259T17:06:54.691");

            dataProductRow.update(aDifferentCompleteMessage);
            expect(dataProductRow.datum["unique_name"]).toEqual("a_different_complete_product_unique_name");
            expect(dataProductRow.datum["checksum"]).toEqual("54321");
            expect(dataProductRow.datum["event_time"]).toEqual("2019-259T17:07:57.800")
        });
    });
});
