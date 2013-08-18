var Db = require('mongodb').Db;
    Connection = require('mongodb').Connection,
    Server = require('mongodb').Server,
    BSON = require('mongodb').BSON,
    ObjectID = require('mongodb').ObjectID,
    MongoURI = require('mongo-uri');

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
