var mongo = require('mongodb'),
    Db = mongo.Db,
    Connection = mongo.Connection,
    BSON = mongo.BSON,
    ObjectID = require('mongodb').ObjectID,
    util = require('util'),
    DBProvider = require('./dbprovider').DBProvider;

PufferProvider = function() {
  this.dbProvider = DBProvider.getInstance();
};

PufferProvider.prototype.find = function(query, options, callback) {
  this.dbProvider.getCollection('Puffers', function(error, puffer_collection) {
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
};

PufferProvider.prototype.findBySenderOrReceiver = function(username, callback, sort) {
  this.find({'$or': [{'sender': username}, {'receiver': username}]}, {'sort': sort}, callback);
};

//find all Puffers
PufferProvider.prototype.findAll = function(callback) {
  this.dbProvider.getCollection('Puffers', function(error, puffer_collection) {
    if( error ) callback(error);
    else {
      puffer_collection.find().toArray(function(error, results) {
        if( error ) callback(error)
        else callback(null, results);
      });
    }
  });
};

//save new Puffer
PufferProvider.prototype.save = function(Puffers, callback) {
  this.dbProvider.getCollection('Puffers', function(error, Puffer_collection) {
    if( error ) callback(error)
    else {
      if( typeof(Puffers.length)=="undefined")
        Puffers = [Puffers];

      for( var i =0;i< Puffers.length;i++ ) {
        Puffer = Puffers[i];
        Puffer.created_at = new Date();
      }

      Puffer_collection.insert(Puffers, function() {
        callback(null, Puffers);
      });
    }
  });
};

PufferProvider.prototype.update = function(Puffer_id, updates, callback) {
    this.dbProvider.getCollection('Puffers', function(error, Puffer_collection) {
      if( error ) callback(error)
      else {
        Puffer_collection.update({"_id":ObjectID(Puffer_id)}, {"$set":updates}, function() {
          callback(null);
        });
      }
    });
}

exports.PufferProvider = PufferProvider;
