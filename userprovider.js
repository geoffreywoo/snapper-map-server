var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

UserProvider = function(host, port) {
  this.db= new Db('node-mongo-User', new Server(host, port, {safe: false}, {auto_reconnect: true}, {}));
  this.db.open(function(){});
};


UserProvider.prototype.getCollection= function(callback) {
  this.db.collection('Users', function(error, user_collection) {
    if( error ) callback(error);
    else callback(null, user_collection);
  });
};

//find all Users
UserProvider.prototype.findAll = function(callback) {
    this.getCollection(function(error, user_collection) {
      if(error) callback(error);
      else {
        user_collection.find().toArray(function(error, results) {
          if (error) {
            callback(error);
          } else {
            console.log(results);
            callback(null, results);
          } 
        });
      }
    });
};

//find by username
UserProvider.prototype.findByUsername = function(username, callback) {
    this.getCollection(function(error, user_collection) {
      if(error) callback(error);
      else {
        console.log(username);
        user_collection.find({"_id":username}).toArray(function(error, results) {
          if(error) callback(error);
          else {
            console.log(results);
            callback(null, results)
          }
        });
      }
    });
};

//save new User
UserProvider.prototype.save = function(users, callback) {
    this.getCollection(function(error, user_collection) {
      if( error ) callback(error)
      else {
        if( typeof(users.length)=="undefined")
          users = [users];

        for( var i =0;i< users.length;i++ ) {
          user = users[i];
          user["_id"] = user.username;
          user.created_at = new Date();
        }

        user_collection.insert(users, function() {
          callback(null, users);
        });
      }
    });
};

UserProvider.prototype.update = function(user_id, updates, callback) {
    this.getCollection(function(error, user_collection) {
      if( error ) callback(error)
      else {
        user_collection.update({"_id":user_id}, {"$set":updates}, function() {
          callback(null);
        });
      }
    });
}

exports.UserProvider = UserProvider;
