/*
 * Serve JSON to our AngularJS client
 */

exports.name = function (req, res) {
    
    res.json({
        data: 'some data'
    });
    
};