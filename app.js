process.env.NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Module dependencies
 */

var express = require('express'),
    morgan = require('morgan'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    serveStatic = require('serve-static'),
    errorhandler = require('errorhandler'),
    exphbs  = require('express-handlebars'),
    http = require('http'),
    path = require('path');

//custom modules
var routes = require('./routes'),
    restApi = require('./routes/restapi');

var app = module.exports = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

/**
 * Configuration
 */

//default
//Template Engine, handlebars
app.engine('.hbs', exphbs({
    extname: '.hbs',
    layoutsDir: "views/",
    defaultLayout: 'layout'
}));
app.set('view engine', '.hbs');
app.set('views', __dirname + '/views');
//port
app.set('port', process.env.PORT || 3000);
//logger
app.use(morgan('combined'));
// parse application/x-www-form-urlencoded 
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json 
app.use(bodyParser.json())
//Lets us use HTTP verbs such as PUT or DELETE in places where the client doesn't support it.
app.use(methodOverride());
app.use(serveStatic(path.join(__dirname, 'public')));

//development
if (app.get('env') === 'development') {
  app.use(errorhandler());
}

// production
if (app.get('env') === 'production') {
  // TODO
};

/**
 * Routes
 */

// serve index and view partials
app.get('/', routes.index);
app.get('/partials/:name', routes.partials);

// JSON API
app.get('/api/name', restApi.name);

// redirect all others to the index (HTML5 history)
app.get('*', routes.index);

// Socket.io Communication
var socket = require('./routes/socket')(io);

/**
 * Start Server
 */

server.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});