/**
 * Created by chandra on 9/19/15.
 */
var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var url = 'mongodb://localhost:27017/test';
var Step = require('step');
var twilio = require('twilio');

var findUser = function(id, db, callback) {
    console.log(id);
    var cursor = db.collection('users').find({phoneNumber: id});
    Step(
        function() {
            var grp = this.group()
            cursor.each(grp())
        },
        function (err, users) {
            console.log(users);
            callback(err, users[0]);
        }
    )
};

/* GET users listing. */
router.get('/', function(req, res, next) {
    var id = '2705621411';
    var resp = new twilio.TwimlResponse();
    console.log(req.body);
    console.log(req.params);
    MongoClient.connect(url, function(err, db) {
        findUser(id, db, function(err, user) {
            var rules = user.rules;
            for(var i = 0; i < rules.length; i++) {
                var rule = rules[i];
                if (rule.type === 'call') {
                    resp.say({voice:'woman'}, 'ahoy hoy! Testing Twilio and node.js');
                }
            }
            res.writeHead(200, {
                'Content-Type':'text/xml'
            });
            res.end(resp.toString());
        });
    });
});

module.exports = router;
