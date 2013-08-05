var mongo = require('mongodb'),
	  Db = mongo.db,
	  Connection = mongo.Connection,
	  Server = mongo.Server,
	  BSON = mongo.BSON,
    MongoURI = require('mongo-uri');

var mongoUriString = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost:27017/otoro-db';

try {
  mongoUri = MongoURI.parse(mongoUriString);
} catch (err) {
  // handle this correctly, kthxbye
}

var mongoclient = new MongoClient(new Server(mongoUri.hosts[0], mongoUri.ports[0], {auto_reconnect: true}, {}));




