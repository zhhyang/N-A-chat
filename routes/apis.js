var express = require('express');
var router = express.Router();
var User = require('../models/user');
var userCtrl = require('../controllers/userCtrl');

/* GET users listing. */
router.get('/validate', function(req, res, next) {
  var _userId = req.session._userId;
  if (_userId) {
    User.findOneById(_userId,function (err,user) {
        if (err){
            res.json(401,{msg:err});
        }else {
            res.json(user);
        }
    })
  }else {
      res.status(401).json(null);
  }
});

router.post('/login',function (req,res,next) {
    var email = req.body.email;
    if (email) {
        userCtrl.findByEmailOrCreate(email, function(err, user) {
            if (err) {
                res.json(500, {msg: err})
            } else {
                req.session._userId = user._id;
                User.online(user._id,function (err,user) {
                    if (err) {
                        res.json(500, {
                            msg: err
                        })
                    } else {
                        res.json(user)
                    }
                });
            }
        })
    } else {
        res.json(403)
    }
});

router.get('/logout',function (req,res,next) {
    var _userId = req.session._userId;
    User.offline(_userId,function (err,user) {
        if (err) {
            res.json(500, {
                msg: err
            })
        } else {
            res.json(200);
            delete req.session._userId
        }
    });
});

module.exports = router;
