var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var url = 'mongodb://localhost:27017/test';
var Step = require('step');

var findUsers = function(db, callback) {
    var cursor = db.collection('users').find();
    Step(
        function() {
            var grp = this.group()
            cursor.each(grp())
        },
        function (err, users) {
            console.log(users);
            callback(err, users);
        }
    )
};

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

var updateRulesForUser = function(id, rules, db, callback) {
    console.log(id);
    var cursor = db.collection('users').update({phoneNumber: id}, {
        $set: {
            rules: rules
        }
    }, callback);
};

/* GET users listing. */
router.get('/', function(req, res, next) {
    MongoClient.connect(url, function(err, db) {
        findUsers(db, function(err, docs) {
            res.json(docs);
        });
    });
});

router.get('/:id', function(req, res, next) {
    MongoClient.connect(url, function(err, db) {
        findUser(req.params.id, db, function(err, doc) {
            res.json(doc);
        });
    });
});

router.get('/:id/rules', function(req, res, next) {
    MongoClient.connect(url, function(err, db) {
        findUser(req.params.id, db, function(err, doc) {
            res.json(doc.rules);
        });
    });
});

router.post('/:id/rules', function(req, res, next) {
    var ruleName = req.body.name;
    var type = req.body.type;
    var rule = req.body.rule;
    var action = req.body.action;
    var message = req.body.message;

    MongoClient.connect(url, function(err, db) {
        findUser(req.params.id, db, function(err, doc) {
            var rules = doc.rules;
            rules[ruleName] = {
                type: type,
                rule: rule,
                action: action,
                message: message
            }
            updateRulesForUser(req.params.id, rules, db, function(err, newDoc) {
                console.log(newDoc);
                res.json({success: true})
            })
        });
    });
})

router.get('/:id/contacts', function(req, res, next) {
    MongoClient.connect(url, function(err, db) {
        findUser(req.params.id, db, function(err, doc) {
            res.json(doc.contacts);
        });
    });
});

module.exports = router;
