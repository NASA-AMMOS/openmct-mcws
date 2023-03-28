/*global define,describe,beforeEach,it,expect*/

define([
    './UTCDayOfYearFormat'
], function (
    UTCDayOfYearFormat
) {
    'use strict';

    describe('UTCDayOfYearFormat', function () {

        var format,
            TEST_CASES = [
                {
                    input: '2015-031T12:34:56.789',
                    value: Date.UTC(2015, 0, 31, 12, 34, 56, 789),
                    formattedValue: '2015-031T12:34:56.789',
                },
                {
                    input: '2015-031T12:34:56',
                    value: Date.UTC(2015, 0, 31, 12, 34, 56),
                    formattedValue: '2015-031T12:34:56.000',
                },
                {
                    input: '2015-031T12:34',
                    value: Date.UTC(2015, 0, 31, 12, 34),
                    formattedValue: '2015-031T12:34:00.000',
                },
                {
                    input: '2015-031T12',
                    value: Date.UTC(2015, 0, 31, 12),
                    formattedValue: '2015-031T12:00:00.000',
                },
                {
                    input: '2015-031',
                    value: Date.UTC(2015, 0, 31),
                    formattedValue: '2015-031T00:00:00.000',
                },
                {
                    input: '2015-01-15T12:34:56.789',
                    value: Date.UTC(2015, 0, 15, 12, 34, 56, 789),
                    formattedValue: '2015-015T12:34:56.789',
                },
                {
                    input: '2015-01-15T12:34:56',
                    value: Date.UTC(2015, 0, 15, 12, 34, 56),
                    formattedValue: '2015-015T12:34:56.000',
                },
                {
                    input: '2015-01-15T12:34',
                    value: Date.UTC(2015, 0, 15, 12, 34),
                    formattedValue: '2015-015T12:34:00.000',
                },
                {
                    input: '2015-01-15T12',
                    value: Date.UTC(2015, 0, 15, 12),
                    formattedValue: '2015-015T12:00:00.000',
                },
                {
                    input: '2015-01-15',
                    value: Date.UTC(2015, 0, 15),
                    formattedValue: '2015-015T00:00:00.000',
                }
            ];

        beforeEach(function () {
            format = new UTCDayOfYearFormat.default();
        });

        it('can format dates properly', function () {
            var input = Date.UTC(2015, 0, 31, 12, 34, 56, 789);
            expect(format.format(input)).toBe('2015-031T12:34:56.789');
        });

        it('forces doy to be 3 digits', function () {
            var input = Date.UTC(2015, 0, 1, 12, 34, 56, 789);
            expect(format.format(input)).toBe('2015-001T12:34:56.789');
            input = Date.UTC(2015, 0, 31, 12, 34, 56, 789);
            expect(format.format(input)).toBe('2015-031T12:34:56.789');
            input = Date.UTC(2015, 3, 10, 12, 34, 56, 789);
            expect(format.format(input)).toBe('2015-100T12:34:56.789');
        });

        TEST_CASES.forEach(function (testCase) {
            it('considers ' + testCase.input + ' valid', function () {
                expect(format.validate(testCase.input)).toBe(true);
            });

            it('can parse ' + testCase.input, function () {
                expect(format.parse(testCase.input)).toEqual(testCase.value);
            });

            it('can format ' + testCase.input, function () {
                expect(format.format(format.parse(testCase.input)))
                    .toEqual(testCase.formattedValue);
            });
        });

        it('parses extended precision correctly', function () {
            var raw = '2017-144T20:32:09.0503099';
            var parsed = format.parse(raw);
            expect(format.format(parsed)).toBe('2017-144T20:32:09.050');
        });
    });
});
