var mongo = require('mongodb'),
    Db = mongo.Db,
    Connection = mongo.Connection,
    BSON = mongo.BSON,
    ObjectID = require('mongodb').ObjectID,
    util = require('util'),
    DBProvider = require('./dbprovider').DBProvider,
    constants = require('./constants');

PufferProvider = function() {
  this.dbProvider = DBProvider.getInstance();
};

PufferProvider.prototype.find = function(query, options, callback) {
  this.dbProvider.getCollection(constants.COLLECTIONS.PUFFER, function(error, puffer_collection) {
    if (error) {
      callback(error);
    } else {
      puffer_collection.find(query, options).toArray(function(error, results) {
        if (error)  {
          callback(error);
        } else {
          callback(null, results);
        }
      });
    }
  });
}

PufferProvider.prototype.findByReceiver = function(username, callback, sort) {
  this.find({'receiver': username}, {'sort': sort}, callback);
};

PufferProvider.prototype.findBySender = function(username, callback, sort) {
  this.find({'sender': username}, {'sort': sort}, callback);
};

PufferProvider.prototype.findByReceiverUnread = function(username, callback) {
  this.find({'receiver': username, 'read': false}, {}, callback);
}

PufferProvider.prototype.findBySenderOrReceiver = function(username, callback, sort) {
  this.find({'$or': [{'sender': username}, {'receiver': username}]}, {'sort': sort}, callback);
};

//find all toros
PufferProvider.prototype.findAll = function(callback) {
    this.dbProvider.getCollection(constants.COLLECTIONS.PUFFER, function(error, puffer_collection) {
      if( error ) callback(error)
      else {
        puffer_collection.find().toArray(function(error, results) {
          if( error ) callback(error)
          else callback(null, results);
        });
      }
    });
};

//save new Toro
PufferProvider.prototype.save = function(toros, callback) {
  this.dbProvider.getCollection(constants.COLLECTIONS.PUFFER, function(error, puffer_collection) {
    if( error ) callback(error)
    else {
      if( typeof(toros.length)=="undefined")
        toros = [toros];

      for( var i =0;i< toros.length;i++ ) {
        toro = toros[i];
        toro.created_at = new Date();
      }

      puffer_collection.insert(toros, function() {
        callback(null, toros);
      });
    }
  });
};

// puffer_id is already an object id, so no need to convert it.
PufferProvider.prototype.update = function(puffer_id, updates, callback) {
    this.dbProvider.getCollection(constants.COLLECTIONS.PUFFER, function(error, puffer_collection) {
      if (error) {
        callback(error);
      } else {
        if (typeof(puffer_id) === "string") {
          puffer_id = ObjectID(puffer_id);
        }
        puffer_collection.update({"_id":puffer_id}, {"$set":updates}, function(error) {
          callback(error);
        });
      }
    });
}

exports.PufferProvider = PufferProvider;
