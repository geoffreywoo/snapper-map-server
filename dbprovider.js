var mongo = require('mongodb'),
	  Db = mongo.Db,
	  Connection = mongo.Connection,
	  Server = mongo.Server,
	  BSON = mongo.BSON,
    MongoURI = require('mongo-uri'),
    util = require('util');
    dbConfig = require('./config/db.json');

DBProvider = function() {
  var config;
  if (process.env.MONGOHQ_URL) {
    config = MongoURI.parse(process.env.MONGOHQ_URL);
    config.host = config.hosts[0];
    config.port = config.ports[0];
  } else {
    var env = process.env.DATA_REALM || 'local';
    for (var i in dbConfig) {
      if (dbConfig[i].realm == env) {
        config = dbConfig[i]
        break;
      }
    }
  }
  if (config) {
    this.db = new Db(config.database, new Server(config.host, config.port, {auto_reconnect: true}), {safe: true});
    this.db.open(function(err, client) {
      console.log("Mongo client opened with:", config);
      if (config.username && config.password) {
        client.authenticate(config.username, config.password, function(error, success) {
          console.log("Authentication success is: ", success);
        });
      }
    });
  } else {
    throw new Error(util.format('Failed to initialize DB. Could not find valid environment variable MONGOHQ_URL or valid env matching %s in %s', env, './config/db.json'));
  }
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