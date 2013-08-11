var mongo = require('mongodb'),
    Db = mongo.Db,
    Connection = mongo.Connection,
    Server = mongo.Server,
    BSON = mongo.BSON,
    ObjectID = require('mongodb').ObjectID,
    util = require('util'),
    MongoClient = mongo.MongoClient;

var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost:27017/node-mongo-User';

ToroProvider = function(host, port) {
  this.db= new Db('node-mongo-User', new Server(host, port, {safe: false}, {auto_reconnect: true}, {}));
  this.db.open(function(){});
};


ToroProvider.prototype.getCollection= function(callback) {
  this.db.collection('Toros', function(error, toro_collection) {
    if( error ) callback(error);
    else callback(null, toro_collection);
  });
};

ToroProvider.prototype.findByReceiver = function(id, callback) {
  this.getCollection(function(error, toro_collection) {
    if ( error ) callback(error);
    else {
      toro_collection.find({'receiver': id}).toArray(function(error, results) {
        if ( error ) callback(error);
        else {
          callback(null, results);
        }
      });
    }
  });
};

ToroProvider.prototype.findBySender = function(id, callback) {
  this.getCollection(function(error, toro_collection) {
    if ( error ) callback(error);
    else {
      toro_collection.find({'sender': id}).toArray(function(error, results) {
        if ( error ) callback(error);
        else {
          callback(null, results);
        }
      });
    }
  });
};

//find all toros
ToroProvider.prototype.findAll = function(callback) {
    this.getCollection(function(error, toro_collection) {
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
ToroProvider.prototype.save = function(Toros, callback) {
    this.getCollection(function(error, toro_collection) {
      if( error ) callback(error)
      else {
        if( typeof(Toros.length)=="undefined")
          Toros = [Toros];

        for( var i =0;i< Toros.length;i++ ) {
          Toro = Toros[i];
          Toro.created_at = new Date();
        }

        toro_collection.insert(Toros, function() {
          callback(null, Toros);
        });
      }
    });
};

exports.ToroProvider = ToroProvider;
