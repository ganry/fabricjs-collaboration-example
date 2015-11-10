/*
 * Serve JSON to our AngularJS client
 */

module.exports = function (app) {

    var self = this;
    var app = app;

    exports.getObjects = function(req, res) {
        res.json({
            obj0:
            {
                type: 'rectangle',
                color: '#00FF00',
                left: 0,
                top: 0,
                id: 0
            },
            obj1:
            {
                type: 'circle',
                color: '#00FF00',
                left: 200,
                top: 0,
                id: 1
            },
            obj2:
            {
                type: 'triangle',
                color: '#00FF00',
                left: 300,
                top: 0,
                id: 2
            },
            obj3 :
            {
                type: 'image',
                url: 'images/icons/user.png',
                left: 460,
                top: 120,
                id: 3
            },
            obj4 :
            {
                type: 'text',
                text: 'Responsive Object',
                left: 200,
                top: 250,
                id: 4
            }
        });
    };


    return exports;

};