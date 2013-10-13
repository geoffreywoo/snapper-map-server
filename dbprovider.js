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
  this.db= new Db(mongoParsedUri.database, new Server(mongoParsedUri.hosts[0], mongoParsedUri.ports[0], {safe: false}, {auto_reconnect: true}, {}));
  this.db.open(function(err, client){
    if (mongoParsedUri.username && mongoParsedUri.password) {
      client.authenticate(mongoParsedUri.username, mongoParsedUri.password, function(error, success) {
      });
    }
    var fixtures = require('pow-mongodb-fixtures').connect(mongoParsedUri.database, {
      host: mongoParsedUri.hosts[0],
      port: mongoParsedUri.ports[0],
      user: mongoParsedUri.username,
      pass: mongoParsedUri.password
    });
    fixtures.load('fixtures/users.js', function(error) {
      if (error) {
        console.log(util.format('Error loading fixtures: %s', error));
      } else {
        console.log('Fixtures loaded successfully!');
      }
    });
  });
};

DBProvider.getInstance = function() {
  if (this.instance == null) {
    this.instance = new DBProvider();
  }
  return this.instance;
}

DBProvider.prototype.getCollection= function(collection, callback) {
  this.db.collection(collection, function(error, user_collection) {
    if( error ) callback(error);
    else callback(null, user_collection);
  });
};

exports.DBProvider = DBProvider;