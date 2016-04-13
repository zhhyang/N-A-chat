/**
 * Created by Freeman on 2016/4/12.
 */
var User = require('../models/user');
var gravatar = require('gravatar');

function findByEmailOrCreate(email, callback) {
   User.get(email,function (err,user) {
        if (user){
            callback(null,user);
        }else {
            var newUser = new User({
                name : email.split('@')[0],
                email : email,
                avatarUrl :gravatar.url(email),
            });
            newUser.save(callback);
        }
    })
}

exports.findByEmailOrCreate = findByEmailOrCreate;
