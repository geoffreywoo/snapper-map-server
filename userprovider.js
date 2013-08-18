var Db = require('mongodb').Db,
    Connection = require('mongodb').Connection,
    Server = require('mongodb').Server,
    BSON = require('mongodb').BSON,
    ObjectID = require('mongodb').ObjectID,
    MongoURI = require('mongo-uri');

var mongoUri = process.env.MONGOHQ_URL ||
  process.env.MONGOLAB_URI ||
  'mongodb://localhost:27017/node-mongo-User';

var mongoParsedUri = MongoURI.parse(mongoUri);

UserProvider = function() {
  this.db= new Db(mongoParsedUri.database, new Server(mongoParsedUri.hosts[0], mongoParsedUri.ports[0], {safe: false}, {auto_reconnect: true}, {}));
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
