/**
 * Created by Freeman on 2016/4/12.
 */
var mongoosedb = require('./mongoosedb');
var Schema = mongoosedb.mongoose.Schema;
var ObjectId = Schema.ObjectId;

var MessageSchema = new Schema({
    content: String,
    creator: {
        _id: ObjectId,
        email: String,
        name: String,
        avatarUrl: String

    },
    _roomId: ObjectId,
    createAt:{type: Date, default: Date.now},
},{
    collection: 'messages'
});

var messageModel = mongoosedb.mongoose.model('Message',MessageSchema);

function Message(message) {
    this.content = message.message;
    this.creator = message.creator;
    this._roomId = message._roomId;
}


Message.prototype.save = function (callback) {

    var message = {
        content:this.content,
        creator : this.creator,
        _roomId : this._roomId
    };

    var newMessage = new messageModel(message);

    newMessage.save(function (err,message) {
        if(err){
            return callback(err);
        }
        callback(null,message);
    })
};

Message.findAll = function (callback) {
    messageModel.find({},null,{
        sort: {
            'createAt': -1
        },
        limit: 20
    },callback);
};

Message.find = function (_roomId,callback) {
    messageModel.find({
        _roomId: _roomId
    }, null, {
        sort: {
            'createAt': -1
        },
        limit: 20
    }, function(err, messages) {
        callback(err, messages.reverse())
    })
};

module.exports = Message;