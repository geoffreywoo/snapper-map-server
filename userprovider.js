var mongo = require('mongodb'),
    Db = mongo.Db,
    Connection = mongo.Connection,
    Server = mongo.Server,
    BSON = mongo.BSON,
    ObjectID = mongo.ObjectID,
    MongoURI = require('mongo-uri'),
    util = require('util'),
    DBProvider = require('./dbprovider').DBProvider;

var mongoUri = process.env.MONGOHQ_URL ||
  process.env.MONGOLAB_URI ||
  'mongodb://localhost:27017/node-mongo-User';

var mongoParsedUri = MongoURI.parse(mongoUri);

UserProvider = function() {
  this.dbProvider = new DBProvider();
};

//find all Users
UserProvider.prototype.findAll = function(callback) {
    this.dbProvider.getCollection('Users', function(error, user_collection) {
      if(error) callback(error);
      else {
        user_collection.find().toArray(function(error, results) {
          if (error) {
            callback(error);
          } else {
            callback(null, results);
          }
        });
      }
    });
};

//find by username
UserProvider.prototype.findByUsername = function(username, callback) {
  this.dbProvider.getCollection('Users', function(error, user_collection) {
    if(error) callback(error);
    else {
      console.log(username);
      user_collection.find({"_id":username}).toArray(function(error, results) {
        if(error) callback(error);
        else if (results.length > 0) {
          callback(null, results);
        } else {
          user_collection.find({"username":username}).toArray(function(error, results) {
            callback(null, results);
          });
        }
      });
    }
  });
};

//save new User
UserProvider.prototype.save = function (users, callback) {
    this.dbProvider.getCollection('Users', function (error, user_collection) {
      if (error) {
        callback(error);
      }
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

UserProvider.prototype.update = function (user_id, updates, callback) {
    this.dbProvider.getCollection('Users', function (error, user_collection) {
      if (error) {
        callback(error)
      } else {
        user_collection.update({"_id":user_id}, {"$set":updates}, function() {
          callback(null);
        });
      }
    });
};

UserProvider.prototype.remove = function(user_id, callback) {
  var dbProvider = this.dbProvider;
  this.findByUsername(user_id, function(error, results) {
    if (error) {
      callback(error);
    } else if (results.length == 0) {
      callback(util.format('User "%s" does not exist.', user_id));
    } else {
      dbProvider.getCollection('Users', function (error, user_collection) {
        if (error) {
          callback(error);
        } else {
          user_collection.remove({"_id":user_id}, function(error) {
            callback(error);
          });

        }
      });
    }
  });
}

exports.UserProvider = UserProvider;
