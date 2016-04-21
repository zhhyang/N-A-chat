/**
 * Created by Freeman on 2016/4/20.
 */

var async = require('async');
var User = require('../models/user');
var Message = require('../models/message');
var Room  = require('../models/room');
var messages = [];
var ObjectId = require('mongoose').Schema.ObjectId;
var SYSTEM = {
    name: 'technode机器人',
    avatarUrl: 'http://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Robot_icon.svg/220px-Robot_icon.svg.png'
};

exports.connect = function (socket) {
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
};

exports.disconnect = function (socket) {
    var _userId = socket.handshake.session._userId;
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
};
/**
 * 创建新房间
 * */
exports.createRoom = function (name,socket) {
    var newRoom = new Room(name);
    newRoom.save(function (err, room) {
        if (err) {
            socket.emit('err', {msg: err})
        } else {
            socket.emit('roomAdded', room)
        }
    })
};

exports.getAllRooms = function (data,socket) {
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
};
exports.getRoom = function (socket) {
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

};