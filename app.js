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

io.sockets.on('connection', function (socket) {

    var _userId = socket.handshake.session._userId;
    User.online(_userId,function (err,user) {
        if (err){
            socket.emit('err',{
                mesg: err
            })
        }else {
            socket.broadcast.emit('online',user);
        }
    });
    
    socket.on('disconnect',function () {
        User.offline(_userId,function (err,user) {
            if (err) {
                socket.emit('err', {
                    mesg: err
                })
            } else {
                if (user._roomId){
                    socket.in(user._roomId).broadcast.emit('leaveRoom', user)
                    socket.in(user._roomId).broadcast.emit('messageAdded', {
                        content: user.name + '离开了聊天室',
                        creator: SYSTEM,
                        createAt: new Date(),
                        _id: ObjectId()
                    });
                    User.leaveRoom(user._id,function () { })
                }
                socket.emit('offline',user);
            }
        })
    });
    /**
     * 创建新房间
     * */
    socket.on('createRoom', function (name) {
        var newRoom = new Room(name);
        newRoom.save(function (err, room) {
            if (err) {
                socket.emit('err', {msg: err})
            } else {
                io.sockets.emit('roomAdded', room)
            }
        })
    });
    /**
     * 
     * */
    socket.on('getAllRooms', function (data) {
        if (data && data._roomId){
            Room.getById(data._roomId,function (err,room) {
                if (err) {
                    socket.emit('err', {
                        msg: err
                    })
                } else {
                    socket.emit('roomData.' + data._roomId, room)
                }
            })
        }else {
            Room.findAll(function (err, rooms) {
                if (err) {
                    socket.emit('err', {msg: err})
                } else {
                    socket.emit('roomsData', rooms)
                }
            })
        }
    });



    socket.on('getRoom', function () {
        async.parallel([
            function(done) {
                User.getOnlineUsers(done)
            },
            function(done) {
                Message.findAll(done)
            }
        ],function (err,results) {
            if (err) {
                socket.emit('err', {msg: err});
            } else {
                socket.emit('roomData', {users: results[0], messages: results[1]});
            }
        });


    });

    socket.on('joinRoom',function (join) {
        User.joinRoom(join,function (err) {
            if (err){
                socket.emit('err', {msg: err});
            }else {
                socket.join(join.room._id);
                socket.emit('joinRoom.'+join.user._id,join);
                socket.in(join.room._id).broadcast.emit('messageAdded',{
                    content:join.user.name+'进入了聊天室',
                    creator:SYSTEM,
                    createAt: new Date(),
                    _id: ObjectId()
                });
                socket.in(join.room._id).broadcast.emit('joinRoom', join)
            }

        })
    });
    /**
     * 离开房间
     * */
    socket.on('leaveRoom',function (leave) {
        User.leaveRoom(leave.user._id,function (err) {
            if (err) {
                socket.emit('err', {
                    msg: err
                })
            }else {
                socket.in(leave._roomId).broadcast.emit('messageAdded', {
                    content: leave.user.name + '离开了聊天室',
                    creator: SYSTEM,
                    createAt: new Date(),
                    _id: ObjectId()
                });
                socket.leave(leave._roomId);
                socket.emit('leaveRoom', leave);
            }
        })
    })
    
    socket.on('createMessage', function (message) {

       var newMessage = new Message(message);
        newMessage.save(function (err,result) {
            if(err){
                socket.emit('err', {msg: err});
            }else {
                socket.in(message._roomId).broadcast.emit('messageAdded',result);
                socket.emit('messageAdded', result);
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
