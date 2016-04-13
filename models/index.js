/**
 * Created by Freeman on 2016/4/12.
 */
var mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/technode')
exports.User = mongoose.model('User', require('./user'))