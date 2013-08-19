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

var userProvider = new UserProvider();
var toroProvider = new ToroProvider();
var friendProvider = new FriendProvider();

// only called when its 200
var sendResponse = function (response, error, data) {
  var responseObj;
  if (error) {
    responseObj = {"ok": false, "error": error}
  } else {
    if (data) {
      var elementsArray;
      if (data instanceof Array) {
        elementsArray = data;
      } else {
        elementsArray = new Array(data);
      }
      responseObj = {"ok": true, "elements": elementsArray}
    } else {
      responseObj = {"ok": true};
    }
  }
  response.setHeader("Content-Type", "application/json");
  response.send(responseObj);
}

app.get('/', function(request, response) {
  sendResponse(response, null, 'Hello World!');
});

app.post('/login', function(request, response) {
  userProvider.findByUsername(request.body.username, function (error, existing_users) {
    if (error) {
      sendResponse(response, error, null);
    } else if (existing_users.length === 0) {
      sendResponse(response, util.format('User "%s" not found.', request.body.username), null);
    } else {
      for (var i = 0; i < existing_users.length; i++) {
        if (request.body.password == existing_users[i].password) {
          sendResponse(response, null, existing_users[i]);
          return;
        }
      }
      sendResponse(response, 'Password did not match.', null);
    }
  });
});

app.post('/users/new', function(request, response) {
  userProvider.findByUsername(request.body.username, function (error, existing_users) {
    if (error) {
      sendResponse(response, error, null);
    } else if (existing_users.length > 0) {
      sendResponse(response, util.format('User "%s" already exists.'), null)
    } else {
      userProvider.save({
        username: request.body.username,
        password: request.body.password,
        email: request.body.email,
        phone: request.body.phone
      }, function(error, docs) {
        sendResponse(response, error, docs);
      });
    }
  });
});

app.get('/users', function(request, response) {
  userProvider.findAll(function(error, docs) {
    sendResponse(response, error, docs);
  });
});

app.get('/users/:username', function(request, response) {
  userProvider.findByUsername(request.params.username, function (error, docs) {
    sendResponse(response, error, docs);
  });
});

app.del('/users/:username', function(request, response) {
  userProvider.remove(request.params.username, function(error) {
    sendResponse(response, error, null);
  });
});

app.put('/users/update/:user_id', function(request, response) {
  userProvider.update(request.params.user_id, request.body, function(error) {
    sendResponse(response, error, null);
  });
});

app.get('/toros', function(request, response) {
  toroProvider.findAll(function (error, docs) {
    sendResponse(response, error, docs);
  });
});

app.post('/toros/new', function(request, response) {
  toroProvider.save({
    latitude: request.body.latitude,
    longitude: request.body.longitude,
    sender: request.body.sender,
    receiver: request.body.receiver,
    message: request.body.message,
    venue: request.body.venue,
    read:false
  }, function(error, docs) {
    sendResponse(response, error, docs);
  });
});

app.get('/toros/received/:user_id', function(request, response) {
  toroProvider.findByReceiver(request.params.user_id, function(error, docs) {
    sendResponse(response, error, docs);
  });
});

app.get('/toros/sent/:user_id', function(request, response) {
  toroProvider.findBySender(request.params.user_id, function(error, docs) {
    sendResponse(response, error, docs);
  });
});

app.put('/toros/set_read/:toro_id', function(request, response) {
  toroProvider.update(request.params.toro_id, {"read":request.body.read}, function(error) {
    sendResponse(response, error, null);
  });
});

app.put('/toros/update/:toro_id', function(request, response) {
  toroProvider.update(request.params.toro_id, request.body, function(error) {
    sendResponse(response, error, null);
  });
});

app.get('/friends/:user_id', function(request, response) {
  friendProvider.findAll(request.params.user_id, function(error, docs) {
    sendResponse(response, error, docs);
  });
});

app.post('/friends/add/:user_id', function(request, response) {
  friendProvider.save(request.params.user_id, request.body.friend_user_id, function(error) {
    sendResponse(response, error, null);
  });
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
