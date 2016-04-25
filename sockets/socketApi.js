/**
 * Created by Freeman on 2016/4/20.
 */

var async = require('async');
var User = require('../models/user');
var Message = require('../models/message');
var Room  = require('../models/room');
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
exports.createRoom = function (data,socket) {
    var newRoom = new Room(data.name);
    newRoom.save(function (err, room) {
        if (err) {
            socket.emit('err', {msg: err})
        } else {
            socket.emit('nachat',{action:'roomAdded',data:room})
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
                socket.emit('nachat',{
                    action:'roomData',
                    _roomId: data._roomId,
                    data:room
                })
            }
        })
    }else {
        Room.findAll(function (err, rooms) {
            if (err) {
                socket.emit('err', {msg: err})
            } else {
                socket.emit('nachat',{
                    action:'roomData',
                    data:rooms
                })
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

exports.joinRoom = function (join,socket) {

    User.joinRoom(join,function (err) {
        if (err){
            socket.emit('err', {msg: err});
        }else {
            socket.join(join.room._id);
            socket.emit('nachat',{action:'joinRoom',data:join});
            socket.in(join.room._id).broadcast.emit('nachat',{action:'messageAdded',data:{
                content:join.user.name+'进入了聊天室',
                creator:SYSTEM,
                createAt: new Date(),
                _id: ObjectId()
            }});
            socket.in(join.room._id).broadcast.emit('nachat',{action:'joinRoom',data:join})
        }

    })
};
/**
 * 离开房间
 * */
exports.leaveRoom = function (leave,socket) {
    User.leaveRoom(leave.user._id,function (err) {
        if (err) {
            socket.emit('err', {
                msg: err
            })
        }else {
            socket.in(leave._roomId).broadcast.emit('nachat',{action:'messageAdded',data: {
                content: leave.user.name + '离开了聊天室',
                creator: SYSTEM,
                createAt: new Date(),
                _id: ObjectId()
            }});
            socket.leave(leave._roomId);
            socket.emit('nachat',{action:'leaveRoom', data:leave});
        }
    })
};

exports.createMessage = function (message,socket) {
    var newMessage = new Message(message);
    newMessage.save(function (err,result) {
        if(err){
            socket.emit('err', {msg: err});
        }else {
            socket.in(message._roomId).broadcast.emit('nachat',{action:'messageAdded',data:result});
            socket.emit('nachat',{action:'messageAdded',data:result});
        }
    })
};