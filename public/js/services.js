'use strict';

/**
 * Services
 */

angular.module('myApp.services', [])
.factory('socketFactory', function ($rootScope) {
    
    var socket = io.connect();
    
    return {
        on: function (eventName, callback) {
            socket.on(eventName, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function (eventName, data, callback) {
            socket.emit(eventName, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            })
        }
    };
})
.factory('commonData', function() {
    
    var commonData = {};
    commonData.Name = '';
    
    return commonData;
});