/*global define,describe,beforeEach,it,expect*/

define([
    './SCLKFloat64Format'
], function (
    SCLKFloat64Format
) {
    'use strict';

    describe('SCLKFormat', function () {
        var format;

        beforeEach(function () {
            format = new SCLKFloat64Format();
        });

        it('can parse values', function () {
            expect(format.parse('5.0410090875E8')).toBe(504100908.75);
            expect(format.parse('504100908.75')).toBe(504100908.75);
            expect(format.parse('5.0410093875E8')).toBe(504100938.75);
            expect(format.parse('504100938.75')).toBe(504100938.75);
            expect(format.parse(504100938.75)).toBe(504100938.75);
        });

        it('can format values', function () {
            expect(format.format(504100908.75)).toBe('504100908.75');
            expect(format.format(504100938.75)).toBe('504100938.75');
        });

        it('can validate values', function () {
            expect(format.validate('5.0410090875E8')).toBe(true);
            expect(format.validate('504100908.75')).toBe(true);
            expect(format.validate('hello')).toBe(false);
            expect(format.validate('0.0')).toBe(true);
        });
    });
});
