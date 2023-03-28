/*global define,describe,beforeEach,it,expect*/

define([
    './MSLSOLFormat'
], function (
    MSLSOLFormat
) {
    'use strict';

    describe('MSLSOLFormat', function () {
        var SOL0,
            millisecondsPerSol,
            format;

        beforeEach(function () {
            SOL0 = Date.UTC(2012, 7, 5, 13, 49, 59);
            millisecondsPerSol = 88775244;
            format = new MSLSOLFormat();
        });

        describe('parse', function () {
            it('knows when SOL-0 is', function () {
                expect(format.parse('SOL-0000M00:00:00.000')).toEqual(SOL0);
            });

            it('converts length of days appropriately', function () {
                expect(format.parse('SOL-0001M00:00:00.000'))
                    .toEqual(SOL0 + millisecondsPerSol);
            });

            it('handles partial inputs', function () {
                expect(format.parse('SOL-0')).toEqual(SOL0);
                expect(format.parse('SOL-0001'))
                    .toEqual(SOL0 + millisecondsPerSol);
            });
        });

        describe('format', function () {
            it('can convert to SOL-0', function () {
                expect(format.format(SOL0)).toEqual('SOL-0000M00:00:00.000');
            });

            it('can handle days correctly', function () {
                expect(format.format(SOL0 + millisecondsPerSol))
                    .toEqual('SOL-0001M00:00:00.000');
            });
        });

        [
            'SOL-001M12:00:00.000',
            'SOL-001M12:00:00',
            'SOL-001M12:00',
            'SOL-001M12',
            'SOL-001',
            'SOL-123',
            'SOL-011',
            'SOL-1',
            'SOL-1043M12:00:00.000'
        ].forEach(function (validDate) {
            it('considers ' + validDate + ' valid', function () {
                expect(format.validate(validDate)).toBe(true);
            });
        });

        it("returns undefined when called with undefined", function () {
            expect(format.parse(undefined)).toBeUndefined();
        });

        it("zero pads sol", function () {
            expect(format.format(format.parse('SOL-12M12:00:00.000')))
                .toBe('SOL-0012M12:00:00.000');
        });

        describe('odd behaviors', function () {
            it('is not off by 1 ms', function () {
                expect(format.format(format.parse('SOL-0318M15:55:05.646')))
                    .toBe('SOL-0318M15:55:05.646');

                expect(format.format(format.parse('SOL-0217M15:55:05.646')))
                    .toBe('SOL-0217M15:55:05.646');

                expect(format.format(format.parse('SOL-0117M15:55:05.646')))
                    .toBe('SOL-0117M15:55:05.646');

                expect(format.format(format.parse('SOL-0017M15:55:05.646')))
                    .toBe('SOL-0017M15:55:05.646');
            });
        });
    });
});
