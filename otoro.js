var express = require("express"),
    app = express(),
    url = require('url'),
    util = require('util'),
    http = require('http'),
    path = require('path'),
    UserProvider = require('./userprovider').UserProvider,
    ToroProvider = require('./toroprovider').ToroProvider;
    FriendProvider = require('./friendprovider').FriendProvider,

app.use(express.logger());
app.use(express.bodyParser());

app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function() {
  app.use(express.errorHandler());
});

var userProvider = new UserProvider('localhost', 27017);
var toroProvider = new ToroProvider('localhost', 27017);
var friendProvider = new FriendProvider('localhost', 27017);

app.get('/', function(request, response) {
  response.send('Hello World!');
});

app.post('/user/new', function(request, response) {
  userProvider.findByUsername(request.body.username, function(error, existing_users) {
    if (error || existing_users.length > 0)
    {
      response.send("Already taken");
      return;
    }
    userProvider.save({
      username: request.body.username,
      password: request.body.password
    }, function(error, docs) {
      if (error) {
        response.send("Error" + error);
      } else {
        response.send("Successful!" + docs);
      }
    });
  });
});

app.get('/user', function(request, response) {
  userProvider.findAll(function(error, docs) {
    response.send(docs);
  });
});

app.get('/toro', function(request, response) {
  toroProvider.findAll(function(error, docs) {
    response.send(docs);
  });
});

app.post('/toro/new', function(request, response) {
  toroProvider.save({
    latitude: request.body.latitude,
    longitude: request.body.longitude,
    sender: request.body.sender,
    receiver: request.body.receiver,
    read:false
  }, function(error, docs) {
    if (error)
    {
      response.send(error);
    } else {
      response.send("Successful!" + JSON.stringify(docs));
    }
  });
});

app.get('/user/contents', function(request, response) {
  var toros = '[{"id":1, "sender":1, "receiver":2, "lat":37.7750, "long":-122.4183, "read":false}, {"id":2, "sender":1, "receiver":2, "lat":37.3041, "long":-121.9000, "read":false}, {"id":3, "sender":1, "receiver":2, "lat":81.11, "long":23.44, "read":true}, {"id":4, "sender":1, "receiver":2, "lat":34.0522, "long":-118.2428, "read":false}]';
  response.setHeader('Content-Type', 'application/json');
  response.send(toros);
});

app.get('/toros/received/:user_id', function(request, response) {
  toroProvider.findByReceiver(request.params.user_id, function(error, docs) {
    response.send(docs);
  });
});

app.get('/toros/sent/:user_id', function(request, response) {
  toroProvider.findBySender(request.params.user_id, function(error, docs) {
    response.send(docs);
  });
});

app.post('/toros/set_read/:toro_id', function(request, response) {
  toroProvider.update(request.params.toro_id, {"read":true}, function(error) {
    if (error) {
      response.send("Failed");
    } else {
      response.send("Successful");
    }
  });
});

app.post('/users/set_fields/:user_id', function(request, response) {
  userProvider.update(request.params.user_id, request.body, function(error) {
    if (error) {
      response.send("Failed");
    } else {
      response.send("Successful");
    }
  });
});

app.get('/friends/:user_id', function(request, response) {
  friendProvider.findAll(request.params.user_id, function(error, docs) {
    response.send(docs);
  });
});

app.post('/friends/add/:user_id', function(request, response) {
  friendProvider.save(request.params.user_id, request.body.friend_user_id, function(error) {
    if (error) {
      response.send("Failed");
    } else {
      response.send("Successful");
    }
  });
});

app.post('/friends/remove/:user_id', function(request, response) {
  friendProvider.remove(request.params.user_id, request.body.friend_user_id, function(error) {
    if (error) {
      response.send("Failed");
    } else {
      response.send("Successful");
    }
  });
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
