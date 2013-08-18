var mongo = require('mongodb'),
	  Db = mongo.Db,
	  Connection = mongo.Connection,
	  Server = mongo.Server,
	  BSON = mongo.BSON,
    MongoURI = require('mongo-uri');

var mongoUri = process.env.MONGOHQ_URL ||
  process.env.MONGOLAB_URI ||
  'mongodb://localhost:27017/node-mongo-User';

var mongoParsedUri = MongoURI.parse(mongoUri);

DBProvider = function() {
  this.db= new Db(mongoParsedUri.database, new Server(mongoParsedUri.hosts[0], mongoParsedUri.ports[0], {safe: false}, {auto_reconnect: true}, {}));
  this.db.open(function(err, client){
    if (mongoParsedUri.username && mongoParsedUri.password) {
      client.authenticate(mongoParsedUri.username, mongoParsedUri.password, function(error, success) {
      });
    }
  });
};

DBProvider.prototype.getCollection= function(collection, callback) {
  this.db.collection(collection, function(error, user_collection) {
    if( error ) callback(error);
    else callback(null, user_collection);
  });
};

exports.DBProvider = DBProvider;