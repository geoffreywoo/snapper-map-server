var express = require("express"),
    app = express(),
    url = require('url'),
    util = require('util'),
    http = require('http'),
    path = require('path'),
    UserProvider = require('./userprovider').UserProvider;

app.use(express.logger());
app.use(express.bodyParser());

app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function() {
  app.use(express.errorHandler());
});

var userProvider = new UserProvider('localhost', 27017);

app.get('/', function(request, response) {
  response.send('Hello World!');
});

app.post('/user/new', function(request, response) {
  userProvider.save({
    username: request.body.username,
    password: request.body.password
  }, function(error, docs) {
    response.send("Successful!");
  });
});

app.get('/user', function(request, response) {
  userProvider.findAll(function(error, docs) {
    response.send(docs);
  });
});

app.get('/user/contents', function(request, response) {
  var toros = '[{"id":1, "sender":1, "receiver":2, "lat":93.44, "long":32.44, "read":false}, {"id":1, "sender":1, "receiver":2, "lat":93.44, "long":32.44, "read":false}]';
  response.setHeader('Content-Type', 'application/json');
  response.send(toros);
});

/**
* ie. set_user_field?field=dog&chicken=cat
*/
app.post('/set_user_field', function(request, response) {
  var params = url.parse(request.url, true).query
  response.send(util.format('User field set! field: %s, value: %s', params.field, params.val));
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
