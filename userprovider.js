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
      if( error ) callback(error)
      else {
        user_collection.find().toArray(function(error, results) {
          if( error ) callback(error)
          else callback(null, results)
        });
      }
    });
};

//save new User
UserProvider.prototype.save = function(Users, callback) {
    this.getCollection(function(error, user_collection) {
      if( error ) callback(error)
      else {
        if( typeof(Users.length)=="undefined")
          Users = [Users];

        for( var i =0;i< Users.length;i++ ) {
          User = Users[i];
          User.created_at = new Date();
        }

        user_collection.insert(Users, function() {
          callback(null, Users);
        });
      }
    });
};

UserProvider.prototype.update = function(user_id, updates, callback) {
    this.getCollection(function(error, user_collection) {
      if( error ) callback(error)
      else {
        user_collection.update({"_id":ObjectID(user_id)}, {"$set":updates}, function() {
          callback(null);
        });
      }
    });
}

exports.UserProvider = UserProvider;
