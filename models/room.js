/**
 * Created by freeman on 16-4-14.
 */

"use strict";


var User = require('./user');
var Message = require('./message');
var async = require('async');
var mongoosedb = require('./mongoosedb');
var Schema = mongoosedb.mongoose.Schema;

var RoomSchema = new Schema({
    name: String,
    createAt:{type: Date, default: Date.now}
},{
    collection: 'rooms'
});

var roomModel = mongoosedb.mongoose.model('Room',RoomSchema);



class Room{
    constructor(name){
        this.name = name
    }

    save(callback){
        var room = {
            name:this.name
        };

        var newRoom = new roomModel(room);

        newRoom.save(function (err,room) {
            if(err){
                return callback(err);
            }
            callback(null,room);
        })
    }


    static findAll(callback){
        roomModel.find({},function(err, rooms) {
            if (!err) {
                var roomsData = []
                async.each(rooms, function(room, done) {
                    var roomData = room.toObject();
                    User.find(roomData._id,function (err,users) {
                        if (err) {
                            done(err)
                        } else {
                            roomData.users = users
                            roomsData.push(roomData)
                            done()
                        }
                    })
                }, function(err) {
                    callback(err, roomsData)
                })
            }
        });
    }

    static getById(_roomId,callback){
        roomModel.find({
            _id:_roomId
        },function (err,room) {
            if (err) {
                callback(err)
            }else {
                async.parallel([
                        function(done) {
                            User.find(_roomId , function(err, users) {
                                done(err, users)
                            })
                        },
                        function(done) {
                            Message.find(_roomId,function (err, messages) {
                                done(err, messages)
                            })
                        }
                    ],
                    function(err, results) {
                        if (err) {
                            callback(err)
                        } else {
                            room = {users: results[0], messages: results[1]};
                            callback(null, room)
                        }
                    });
            }
        });
    }
}

module.exports = Room;