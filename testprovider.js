var mongo = require('mongodb'),
    util = require('util'),
    Server = mongo.Server;


var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/mydb';

TestProvider = function() {
  this.db= new Db('node-mongo-User', new Server(host, port, {safe: false}, {auto_reconnect: true}, {}));
  this.db.open(function(){});
}

TestProvider.prototype.insert = function(key, val, callback) {
  mongo.Db.connect(mongoUri, function (err, db) {
  db.collection('mydocs', function(err, collection) {
    collection.insert({key: val}, {safe: true}, function(err,rs) {
      callback(err, rs);
    });
  });
});
};
