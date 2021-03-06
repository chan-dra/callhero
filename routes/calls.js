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
    MongoClient.connect(url, function(err, db) {
        findUser(id, db, function(err, user) {
            var rules = Object.keys(user.rules);
            for(var i = 0; i < rules.length; i++) {
                var rule = user.rules[rules[i]];
                if (rule.type === 'call') {
                    //resp.say({voice:'woman'}, 'ahoy hoy! Testing Twilio and node.js');
                    if (rule.rule === 'not_in_contacts') {
                        var isCallerInContacts = false;
                        var contacts = user.contacts;
                        if (req.query.From) {
                            var fromNumber = req.query.From;
                            for (var j = 0; j < contacts.length; j++) {
                                var contact = contacts[j];
                                console.log(contact.phoneNumber);
                                if (fromNumber.indexOf(contact.phoneNumber) > -1) {
                                    isCallerInContacts = true;
                                    break;
                                }
                            }

                        }
                        if (rule.action === 'drop') {
                            if (isCallerInContacts) {
                                resp.dial({}, function(node) {
                                    node.number(id);
                                });
                            } else {
                                resp.say({voice:'woman'}, rule.message);
                            }
                        }
                    } else if (rule.rule === 'weekend') {
                        var today = new Date().getDay();
                        var isWeekend = (today == 6) || (today == 0);
                        console.log(today);
                        if (isWeekend && rule.action === 'drop') {
                            resp.say({voice:'woman'}, rule.message);
                        } else {
                            resp.dial({}, function(node) {
                                node.number(id);
                            });
                        }
                    }
                }
            }

            if (rules.length === 0) {
                resp.dial({}, function(node) {
                    node.number(id);
                });
            }

            res.writeHead(200, {
                'Content-Type':'text/xml'
            });
            res.end(resp.toString());
        });
    });
});

module.exports = router;
