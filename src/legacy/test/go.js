/*global define,jasmine,waitsFor*/
define([
], function () {
    /**
     * return a function that when called, allows jasmine to go to the
     */
    function go() {
        var doneWaiting = false;
        function stopWaiting() {
            doneWaiting = true;
        }
        waitsFor(function () {
            return doneWaiting;
        });
        return stopWaiting;
    }

    return go;

});
