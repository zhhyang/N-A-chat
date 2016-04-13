/**
 * Created by Freeman on 2016/4/12.
 */
var mongoosedb = require('./mongoosedb');
var Schema = mongoosedb.mongoose.Schema;
var ObjectID = require('mongodb').ObjectID;

var UserSchema = new Schema({
    email: String,
    name: String,
    avatarUrl: String,
    online:Boolean,
},{
    collection: 'users'
});

var userModel = mongoosedb.mongoose.model('User',UserSchema);

function User(user) {
    this.name = user.name;
    this.email = user.email;
    this.avatarUrl= user.avatarUrl;
}


User.prototype.save = function (callback) {

    var user = {
        email:this.email,
        name : this.name,
        avatarUrl: this.avatarUrl
    };

    var newUser = new userModel(user);

    newUser.save(function (err,user) {
        if(err){
            return callback(err);
        }
        callback(null,user);
    })
};

User.get = function (email,callback) {
    userModel.findOne({
        "email":email
    },function (err,user) {
        if (err) {
            return callback(err);
        }
        callback(null, user);
    })
};

User.findOneById = function (id,callback) {
    userModel.findOne({
        "_id": ObjectID(id)
    },function (err,user) {
        if (err) {
            return callback(err);
        }
        callback(null, user);
    })
};


User.online = function(_userId, callback) {
    userModel.findOneAndUpdate({
        "_id": ObjectID(_userId)
    }, {
        $set: {
            online: true
        }
    }, callback)
};
User.offline = function(_userId, callback) {
    userModel.findOneAndUpdate({
        "_id": ObjectID(_userId)
    }, {
        $set: {
            online: false
        }
    }, callback)
};

User.getOnlineUsers = function(callback) {
    userModel.find({
        "online": true
    }, callback)
};

module.exports = User;