/*global define,describe,beforeEach,it,expect*/

define([
    './UTCFormat'
], function (
    UTCFormat
) {
    'use strict';

    describe('UTCFormat', function () {

        var format,
            TEST_CASES = [
                {
                    input: '2015-031T12:34:56.789',
                    value: Date.UTC(2015, 0, 31, 12, 34, 56, 789),
                    formattedValue: '2015-01-31T12:34:56.789',
                },
                {
                    input: '2015-031T12:34:56',
                    value: Date.UTC(2015, 0, 31, 12, 34, 56),
                    formattedValue: '2015-01-31T12:34:56.000',
                },
                {
                    input: '2015-031T12:34',
                    value: Date.UTC(2015, 0, 31, 12, 34),
                    formattedValue: '2015-01-31T12:34:00.000',
                },
                {
                    input: '2015-031T12',
                    value: Date.UTC(2015, 0, 31, 12),
                    formattedValue: '2015-01-31T12:00:00.000',
                },
                {
                    input: '2015-031',
                    value: Date.UTC(2015, 0, 31),
                    formattedValue: '2015-01-31T00:00:00.000',
                },
                {
                    input: '2015-01-15T12:34:56.789',
                    value: Date.UTC(2015, 0, 15, 12, 34, 56, 789),
                    formattedValue: '2015-01-15T12:34:56.789',
                },
                {
                    input: '2015-01-15T12:34:56',
                    value: Date.UTC(2015, 0, 15, 12, 34, 56),
                    formattedValue: '2015-01-15T12:34:56.000',
                },
                {
                    input: '2015-01-15T12:34',
                    value: Date.UTC(2015, 0, 15, 12, 34),
                    formattedValue: '2015-01-15T12:34:00.000',
                },
                {
                    input: '2015-01-15T12',
                    value: Date.UTC(2015, 0, 15, 12),
                    formattedValue: '2015-01-15T12:00:00.000',
                },
                {
                    input: '2015-01-15',
                    value: Date.UTC(2015, 0, 15),
                    formattedValue: '2015-01-15T00:00:00.000',
                }
            ];

        beforeEach(function () {
            format = new UTCFormat.default();
        });

        it('can format dates properly', function () {
            var input = Date.UTC(2015, 0, 31, 12, 34, 56, 789);
            expect(format.format(input)).toBe('2015-01-31T12:34:56.789');
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
    });
});
