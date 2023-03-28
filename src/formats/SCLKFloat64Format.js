/*global define*/
define([
    'lodash'
], function (
    _
) {

   /**
    * Format for SCLK values as 64 bit float.
    *
    * @implements {Format}
    * @constructor
    */
   function SCLKFloat64Format() {
       this.key = 'sclk.float64';
   }

   SCLKFloat64Format.prototype.format = function (value) {
       return value && value.toString ? value.toString() : '';
   };

   SCLKFloat64Format.prototype.parse = function (stringValue) {
       return parseFloat(stringValue);
   };

   SCLKFloat64Format.prototype.validate = function (stringValue) {
       var floatValue = this.parse(stringValue);
       return !_.isNaN(floatValue);
   };

   return SCLKFloat64Format;

});
