var express = require('express');
var async = require('async')
var path = require('path');
var http = require('http');
var favicon = require('serve-favicon');
var logger = require('morgan');
var debug = require('debug')('N-A-chat:server');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var config = require('./config');
var signedCookieParser = cookieParser(config.cookieSecret)
var socket = require('socket.io');

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
app.use(session({
    secret: config.cookieSecret,
    key: config.key,
    store: store,
    cookie: {maxAge: 1000 * 60 * 60 },//
    resave: true,
    saveUninitialized: true
}));


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
//设置socket的session验证
/*io.use(function (socket,next) {
    //parseCookie会解析socket.request.headers.cookie并赋值给执行socket.request.cookies
    signedCookieParser(socket.request, null, function(err) {
        if (err) {
            console.log("err parse");
            return next(new Error("cookie err"));
        }
        // cookie中获取sessionId
        var connect_sid = socket.request.cookies['connect_sid'];
        if (connect_sid) {
            //通过cookie中保存的session的id获取到服务器端对应的session
            store.get(connect_sid, function(error, session){
                if (error) {
                    return next(new Error('Authentication error'));
                }
                else {
                    // save the session data and accept the connection
                    socket.request.session = session;
                    next();
                }
            });
        }
    });

});*/
/*io.set('authorization',function (handshakeData, accept) {
    signedCookieParser(handshakeData, {}, function(err) {
        if (err) {
            accept(err, false)
        } else {
            store.get(handshakeData.signedCookies['connect.sid'], function(err, session) {
                if (err) {
                    accept(err.message, false)
                } else {
                    handshakeData.session = session;
                    if (session._userId) {
                        accept(null, true)
                    } else {
                        accept('No login')
                    }
                }
            })
        }
    })
});*/
/**
 *  socket.io 绑定到服务器上，
 *  于是任何连接到该服务器的客户端都具备了实时通信功能
 *
 * */

var User = require('./models/user');
var Message = require('./models/message');
var messages = [];
io.sockets.on('connection', function (socket) {

    /*var _userId = socket.handshake.session._userId;
    User.online(_userId,function (err,user) {
        if (err){
            socket.emit('err',{
                mesg: err
            })
        }else {
            socket.broadcast.emit('online',user);
        }
    });*/
    
    /*socket.on('disconnect',function () {
        User.offline(_userId,function (err,user) {
            if (err) {
                socket.emit('err', {
                    mesg: err
                })
            } else {
                socket.broadcast.emit('offline', user)
            }
        })
    });*/

    socket.on('getRoom', function () {
        User.getOnlineUsers(function (err,users) {
            if (err) {
                socket.emit('err', {msg: err})
            } else {
                socket.emit('roomData', {users: users, messages: messages})
            }
        });
    });
    socket.on('createMessage', function (message) {

       var newMessage = new Message(message);
        newMessage.save(function (err,result) {
            if(err){

            }else {
                io.sockets.emit('messageAdded', result);
            }
        })
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
