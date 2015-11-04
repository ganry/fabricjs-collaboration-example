/*
 * Serve content over a socket
 */

module.exports = function (io) {

    var users = [];

    var getUserById = function (id) {

        for (var i = 0; i < users.length; i++) {
            if (users[i].id === id)
                return users[i];
        }
        return undefined;

    };
    
    var getUserIndexById = function(id) {
        for (var i = 0; i < users.length; i++) {
            if (users[i].id === id)
                return i;
        }
        return -1;
    }


    io.sockets.on('connection', function (socket) {
        
        var user = getUserById(socket.id);
        if (typeof user === 'undefined')
            users.push({id: socket.id, name: ''});
        
        io.sockets.emit('users', users);
        
        socket.on('disconnect', function() {
            var index = getUserIndexById(socket.id);
            
            if (index > -1)
                users.splice(index, 1);
            
            socket.broadcast.emit('users', users);
        });


        socket.on('object:modifying', function (value) {
            
            //send object:modifying to everyone except the sender
            socket.broadcast.emit('object:modifying', value);

        });
        
        socket.on('object:stoppedModifying', function (value) {

            //send object:stoppedModifying to everyone except the sender
            socket.broadcast.emit('object:stoppedModifying', value);

        });

        socket.on('setUser', function (value) {
            
            var user = getUserById(socket.id);
            if (typeof user !== 'undefined')
                user.name = value;
            
            io.sockets.emit('users', users);

        });
    });
}