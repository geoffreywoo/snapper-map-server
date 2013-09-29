var mongo = require('mongodb'),
    Db = mongo.Db,
    Connection = mongo.Connection,
    BSON = mongo.BSON,
    ObjectID = require('mongodb').ObjectID,
    util = require('util'),
    DBProvider = require('./dbprovider').DBProvider;

ToroProvider = function() {
  this.dbProvider = new DBProvider();
};

ToroProvider.prototype.find = function(query, options, callback) {
  this.dbProvider.getCollection('Toros', function(error, toro_collection) {
    if (error) {
      callback(error);
    } else {
      toro_collection.find(query, options).toArray(function(error, results) {
        if (error)  {
          callback(error);
        } else {
          callback(null, results);
        }
      });
    }
  });
}

ToroProvider.prototype.findByReceiver = function(username, callback, sort) {
  this.find({'receiver': username}, {'sort': sort}, callback);
};

ToroProvider.prototype.findBySender = function(username, callback, sort) {
  this.find({'sender': username}, {'sort': sort}, callback);
};

ToroProvider.prototype.findByReceiverUnread = function(username, callback) {
  this.find({'receiver': username, 'read': false}, {}, callback);
}

ToroProvider.prototype.findBySenderOrReceiver = function(username, callback, sort) {
  this.find({'$or': [{'sender': username}, {'receiver': username}]}, {'sort': sort}, callback);
};

//find all toros
ToroProvider.prototype.findAll = function(callback) {
    this.dbProvider.getCollection('Toros', function(error, toro_collection) {
      if( error ) callback(error)
      else {
        toro_collection.find().toArray(function(error, results) {
          if( error ) callback(error)
          else callback(null, results);
        });
      }
    });
};

//save new Toro
ToroProvider.prototype.save = function(toros, callback) {
  this.dbProvider.getCollection('Toros', function(error, toro_collection) {
    if( error ) callback(error)
    else {
      if( typeof(toros.length)=="undefined")
        toros = [toros];

      for( var i =0;i< toros.length;i++ ) {
        toro = toros[i];
        toro.created_at = new Date();
      }

      toro_collection.insert(toros, function() {
        callback(null, toros);
      });
    }
  });
};

ToroProvider.prototype.update = function(toro_id, updates, callback) {
    this.dbProvider.getCollection('Toros', function(error, toro_collection) {
      if( error ) callback(error)
      else {
        toro_collection.update({"_id":ObjectID(toro_id)}, {"$set":updates}, function() {
          callback(null);
        });
      }
    });
}

exports.ToroProvider = ToroProvider;
