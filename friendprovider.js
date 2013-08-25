var Db = require('mongodb').Db;
    Connection = require('mongodb').Connection,
    Server = require('mongodb').Server,
    BSON = require('mongodb').BSON,
    ObjectID = require('mongodb').ObjectID,
    MongoURI = require('mongo-uri'),
    util = require('util');

var mongoUri = process.env.MONGOHQ_URL ||
  process.env.MONGOLAB_URI ||
  'mongodb://localhost:27017/node-mongo-User';

var mongoParsedUri = MongoURI.parse(mongoUri);

FriendProvider = function() {
  this.dbProvider = new DBProvider();
};

// Friends is structured like [{"user_id":"jonochang", "friends":["tonygwu", "geoffwoo"]}]

//find all Friends
FriendProvider.prototype.findAll = function(user_id, callback) {
  this.dbProvider.getCollection('Friends', function(error, friend_collection) {
    if( error ) callback(error)
    else {
      friend_collection.find({"user_id":user_id}).toArray(function(error, results) {
        if( error ) callback(error)
        else callback(null, results)
      });
    }
  });
};

//find all Friends
FriendProvider.prototype.find = function(user_id, friend_user_id, callback) {
  this.dbProvider.getCollection('Friends', function(error, friend_collection) {
    if (error) {
      callback(error);
    } else {
      friend_collection.findOne({"user_id":user_id}, function(error, result) {
        if (error) {
          callback(error);
        } else {
          var friends = result.friends;
          for (var i = 0; i < friends.length; i++) {
            var result = friends[i];
            console.log(result);
            if (result === friend_user_id) {
              callback(error, result);
              return;
            }
          }
          callback(util.format("%s is not a friend of %s.", friend_user_id, user_id), null);
        }
      });
    }
  });
};

editFunction = function(operation) {
  return function(user_id, friends, callback) {
    this.dbProvider.getCollection('Friends', function(error, friend_collection) {
      if (error) {
        callback(error);
      } else {
        if(typeof(friends.length) == "undefined") {
          friends = [friends];
        }
        friend_collection.update({"user_id":user_id}, {"friends": friends}, {"upsert":true}, function() {
          callback(null, friends);
        });
      }
    });
  }
}

FriendProvider.prototype.save = editFunction("$addToSet");
FriendProvider.prototype.remove = editFunction("$pull");

exports.FriendProvider = FriendProvider;
