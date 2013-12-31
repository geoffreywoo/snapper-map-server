var mongo = require('mongodb'),
	  Db = mongo.Db,
	  Connection = mongo.Connection,
	  Server = mongo.Server,
	  BSON = mongo.BSON,
    MongoURI = require('mongo-uri'),
    util = require('util');


var mongoUri = process.env.MONGOHQ_URL ||
  process.env.MONGOLAB_URI ||
  'mongodb://localhost:27017/node-mongo-User';

var mongoParsedUri = MongoURI.parse(mongoUri);

DBProvider = function() {
  this.db = new Db(mongoParsedUri.database, new Server(mongoParsedUri.hosts[0], mongoParsedUri.ports[0], {auto_reconnect: true}), {safe: true});
  this.db.open(function(err, client) {
    if (mongoParsedUri.username && mongoParsedUri.password) {
      client.authenticate(mongoParsedUri.username, mongoParsedUri.password, function(error, success) {
      });
    }
  });
};

DBProvider.getInstance = function() {
  if (this.instance == null) {
    this.instance = new DBProvider();
  }
  return this.instance;
}

DBProvider.prototype.getCollection= function(collection_name, callback) {
  this.db.collection(collection_name, function(error, collection) {
    if (error) {
      callback(error);
    } else {
      callback(null, collection);
    }
  });
};

exports.DBProvider = DBProvider;