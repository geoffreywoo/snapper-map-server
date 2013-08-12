var mongo = require('mongodb'),
    Db = mongo.Db,
    Connection = mongo.Connection,
    Server = mongo.Server,
    BSON = mongo.BSON,
    ObjectID = require('mongodb').ObjectID,
    util = require('util'),
    MongoURI = require('mongo-uri'),
    MongoClient = mongo.MongoClient;

var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost:27017/node-mongo-User';

var mongoParsedUri = MongoURI.parse(mongoUri);

ToroProvider = function(host, port) {
  this.db= new Db(mongoParsedUri.database, new Server(mongoParsedUri.hosts[0], mongoParsedUri.ports[0], {safe: false}, {auto_reconnect: true}, {}));
  this.db.open(function(err, client){
    if (mongoParsedUri.username && mongoParsedUri.password) {
      client.authenticate(mongoParsedUri.username, mongoParsedUri.password, function(error, success) {
        console.log(error);
        console.log(util.format("success is: %b", success));
      });
    }
  });
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
ToroProvider.prototype.save = function(toros, callback) {
    this.getCollection(function(error, toro_collection) {
      if( error ) callback(error)
      else {
        if( typeof(toros.length)=="undefined")
          toros = [toros];

        for( var i =0;i< Toros.length;i++ ) {
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
    this.getCollection(function(error, toro_collection) {
      if( error ) callback(error)
      else {
        toro_collection.update({"_id":ObjectID(toro_id)}, {"$set":updates}, function() {
          callback(null);
        });
      }
    });
}

exports.ToroProvider = ToroProvider;
