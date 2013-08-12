var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

FriendProvider = function(host, port) {
  this.db= new Db('node-mongo-User', new Server(host, port, {safe: false}, {auto_reconnect: true}, {}));
  this.db.open(function(){});
};

// Friends is structured like [{"user_id":"jonochang", "friends":["tonygwu", "geoffwoo"]}]

FriendProvider.prototype.getCollection= function(callback) {
  this.db.collection('Friends', function(error, friend_collection) {
    if( error ) callback(error);
    else callback(null, friend_collection);
  });
};

//find all Friends
FriendProvider.prototype.findAll = function(user_id, callback) {
    this.getCollection(function(error, friend_collection) {
      if( error ) callback(error)
      else {
        friend_collection.find({"user_id":user_id}).toArray(function(error, results) {
          if( error ) callback(error)
          else callback(null, results)
        });
      }
    });
};

editFunction = function(operation) {
  return function(user_id, friends, callback) {
    this.getCollection(function(error, friend_collection) {
      if( error ) callback(error)
      else {
        if( typeof(friends.length)=="undefined")
          friends = [friends];

        updates = {};
        updates[operation] = {"friends": friends};
        friend_collection.update({"user_id":user_id}, updates, {"upsert":true}, function() {
          callback(null, friends);
        });
      }
    });
  }
}

FriendProvider.prototype.save = editFunction("$addToSet");
FriendProvider.prototype.remove = editFunction("$pull");

/*
FriendProvider.prototype.save = function(user_id, friends, callback) {
  this.getCollection(function(error, friend_collection) {
    if( error ) callback(error)
    else {
      if( typeof(friends.length)=="undefined")
        friends = [friends];

      friend_collection.update({"user_id":user_id}, {'$push': {"friends": friends}}, {"upsert":true}, function() {
        callback(null, friends);
      });
    }
  });
}
*/


exports.FriendProvider = FriendProvider;
