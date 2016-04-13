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
    createAt:{type: Date, default: Date.now},
},{
    collection: 'messages'
});

var messageModel = mongoosedb.mongoose.model('Message',MessageSchema);

function Message(message) {
    this.content = message.message;
    this.creator = message.creator;
}


Message.prototype.save = function (callback) {

    var message = {
        content:this.content,
        creator : this.creator,
    };

    var newMessage = new messageModel(message);

    newMessage.save(function (err,message) {
        if(err){
            return callback(err);
        }
        callback(null,message);
    })
};

module.exports = Message;