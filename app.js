var express = require('express');
var path = require('path');
var http = require('http');
var favicon = require('serve-favicon');
var logger = require('morgan');
var debug = require('debug')('N-A-chat:server');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var config = require('./config');
var sharedsession = require("express-socket.io-session");
var socket = require('socket.io');
var async = require('async');

//用Mongo来存储session
var MongoStore = require('connect-mongo')(session);

var apis = require('./routes/apis');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var store = new MongoStore({
    url: 'mongodb://localhost:27017/nachat',
    collection: 'sessions'
});
var sessionStore = session({
    secret: config.cookieSecret,
    key: config.key,
    store: store,
    cookie: {maxAge: 1000 * 60 * 60 },//
    resave: true,
    saveUninitialized: true
});
app.use(sessionStore);


app.use('/api', apis);

app.use(function (req, res) {
    res.sendFile('/index.html');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

/*------------------------------------------------*/

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 *
 * */
var io = socket.listen(server);
/**
 * socket.io 认证
 * */
io.use(sharedsession(sessionStore));

/**
 *  socket.io 绑定到服务器上，
 *  于是任何连接到该服务器的客户端都具备了实时通信功能
 *
 * */

var User = require('./models/user');
var Message = require('./models/message');
var Room  = require('./models/room');
var messages = [];
var ObjectId = require('mongoose').Schema.ObjectId;
var SYSTEM = {
    name: 'technode机器人',
    avatarUrl: 'http://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Robot_icon.svg/220px-Robot_icon.svg.png'
}
var socketApi = require('./sockets/socketApi');

io.sockets.on('connection', function (socket) {

    socketApi.connect(socket);
    
    
    socket.on('disconnect',function () {
        socketApi.disconnect(socket);
    });

    socket.on('nachat',function (request) {
        socketApi[request.action](request.data,socket,io);
    });
});
/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
}

module.exports = app;
