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
  var username = request.body.username;
  userProvider.findByUsername(username, function (error, existing_users) {
    if (error) {
      sendResponse(response, error, null);
    } else if (existing_users.length > 0) {
      sendResponse(response, util.format('User "%s" already exists.', username), null);
    } else {
      var email = request.body.email;
      userProvider.findByEmail(email, function (error, existing_users) {
        if (error) {
          sendResponse(response, error, null);
        } else if (existing_users.length > 0) {
          sendResponse(response, util.format('Email "%s" already exists.', email), null);
        } else {
          userProvider.save({
            username: username,
            password: request.body.password,
            email: email,
            phone: request.body.phone
          }, function(error, docs) {
            sendResponse(response, error, docs);
          });
        }
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

app.post('/users/address_book', function(request, response) {
  userProvider.addressBookMatch(request.body.phones, request.body.emails, function(error, docs) {
    sendResponse(response, error, docs);
  });
});

app.get('/toros', function(request, response) {
  toroProvider.findAll(function (error, docs) {
    sendResponse(response, error, docs);
  });
});

app.post('/toros/new', function(request, response) {
  var latitude = request.body.latitude;
  var longitude = request.body.longitude;
  var sender = request.body.sender;
  var receiver = request.body.receiver;
  console.log(util.format("latitude is: ", latitude));
  if (latitude && longitude && sender && receiver) {
    if (latitude >= -90.0 && latitude <= 90.0 && longitude >= -180.0 && longitude <= 180.0) {
      userProvider.findOneByUsername(sender, function(error, result) {
        if (error) {
          sendResponse(response, error);
        } else if (result) {
          userProvider.findOneByUsername(receiver, function(error, result) {
            if (error) {
              sendResponse(response, error);
            } else if (result) {
              toroProvider.save({
                latitude: latitude,
                longitude: longitude,
                sender: sender,
                receiver: receiver,
                message: request.body.message,
                venue: request.body.venue,
                read:false
              }, function(error, docs) {
                sendResponse(response, error, docs);
              });
            } else {
              sendResponse(response, util.format("User %s does not exist.", receiver));
            }
          });
        } else {
          sendResponse(response, util.format("User %s doesn't exist.", sender));
        }
      });
    } else {
      sendResponse(response, "Latitude or Longitude is out of range.");
    }
  } else {
    sendResponse(response, "Request missing one of required attributes: latitude, longitude, sender or receiver.");
  }
});

app.get('/toros/received/:user_id', function(request, response) {
  toroProvider.findByReceiver(request.params.user_id, function (error, docs) {
    sendResponse(response, error, docs);
  });
});

app.get('/toros/sent/:user_id', function(request, response) {
  toroProvider.findBySender(request.params.user_id, function (error, docs) {
    sendResponse(response, error, docs);
  });
});

app.get('/toros/:user_id', function(request, response) {
  var username = request.params.user_id;
  userProvider.findOneByUsername(username, function (error, result) {
    if (error) {
      sendResponse(response, error);
    } else if (result) {
      toroProvider.findByReceiver(username, function (error, usersByReceiver) {
        if (error) {
          sendResponse(response, error);
        } else {
          toroProvider.findBySender(username, function (error, usersBySender) {
            if (error) {
              sendResponse(response, error);
            } else {
              var ret = usersByReceiver.concat(usersBySender);
              sendResponse(response, null, ret);
            }
          });
        }
      })
    } else {
      sendResponse(util.format('User "%s" does not exist.', username));
    }
  });
});

app.put('/toros/set_read/:toro_id', function(request, response) {
  var read = request.body.read;
  if (read === null || read === undefined) { // Setting read without parameters sets read to true.
    read = true;
  }
  toroProvider.update(request.params.toro_id, {"read":read}, function(error) {
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

app.get('/friends/:user_id/:friend_user_id', function(request, response) {
  friendProvider.find(request.params.user_id, request.params.friend_user_id, function(error, docs) {
    sendResponse(response, error, docs);
  });
});

app.post('/friends/:user_id/:friend_user_id', function(request, response) {
  var user_id = request.params.user_id;
  var friend_user_id = request.params.friend_user_id;
  userProvider.findByUsername(user_id, function(error, results) {
    if (error || results.length == 0) {
      sendResponse(response, util.format('User "%s" was not found.', user_id), null);
    } else {
      userProvider.findByUsername(friend_user_id, function(error, results) {
        if (error || results.length == 0) {
          sendResponse(response, util.format('User "%s" was not found.', friend_user_id), null);
        } else {
          friendProvider.save(user_id, {"user_id": friend_user_id, "blocked": false}, function(error, friends) {
            if (error) {
              sendResponse(response, error, null);
            } else {
              friendProvider.save(friend_user_id, {"user_id": user_id, "blocked": false}, function(error) {
                sendResponse(response, error, friends);
              });
            }
          });
        }
      });
    }
  });
});

app.del('/friends/:user_id/:friend_user_id', function(request, response) {
  friendProvider.remove(request.params.user_id, {"user_id": request.params.friend_user_id}, function(error, friends) {
    if (error) {
      sendResponse(response, error, null);
    } else {
      friendProvider.remove(request.params.friend_user_id, {"user_id": request.params.user_id}, function(error) {
        sendResponse(response, error, friends);
      });
    }
  });
});

app.put('/friends/block/:user_id/:friend_user_id', function(request, response) {
  friendProvider.update(request.params.user_id, {"user_id": request.params.friend_user_id, "blocked": true}, function(error, friend) {
    sendResponse(response, error, friend);
  });
});

// TODO check this endpoint works.
app.put('/friends/:user_id/:friend_user_id', function(request, response) {
  friendProvider.update(request.params.user_id, request.body, function(error, friend) {
      sendResponse(response, error, null);
  });
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
