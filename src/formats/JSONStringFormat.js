/*global define*/
define([
    'lodash'
], function (
    _
) {

   /**
    * Format embedded JavaScript objects as JSON strings for debugging
    *
    * @implements {Format}
    * @constructor
    */
   function JSONStringFormat() {
       this.key = 'jsonString';
   }

   JSONStringFormat.prototype.format = function (value) {
       return JSON.stringify(value);
   };

   JSONStringFormat.prototype.parse = function (stringValue) {
        if (typeof stringValue === 'string') {
            return JSON.parse(stringValue);
        } else {
            return stringValue;
        }
   };

   JSONStringFormat.prototype.validate = function (stringValue) {
       try {
           JSON.parse(stringValue);
           return true;
       } catch (error) {
           console.error('Failed to parse %s', stringValue);
           return false;
       }
   };

   return JSONStringFormat;

});
