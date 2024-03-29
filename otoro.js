var express = require("express"),
    app = express(),
    url = require('url'),
    util = require('util'),
    http = require('http'),
    path = require('path'),
    async = require('async'),
    crypto = require('crypto'),
    ObjectID = require('mongodb').ObjectID,
    UserProvider = require('./userprovider').UserProvider,
    UserController = require('./controllers/user-controller').UserController,
    PushController = require('./controllers/push-controller').PushController,
    FriendController = require('./controllers/friend-controller').FriendController,
    PufferController = require('./controllers/puffer-controller').PufferController,
    ToroController = require('./controllers/toro-controller').ToroController,
    ToroProvider = require('./toroprovider').ToroProvider,
    FriendProvider = require('./friendprovider').FriendProvider,
    AddressbookProvider = require('./addressbookprovider').AddressbookProvider,
    constants = require('./constants');


app.use(express.logger());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.query());

var userProvider = new UserProvider();
var toroProvider = new ToroProvider();
var pushController = new PushController();
var toroController = new ToroController(pushController);
var pufferController = new PufferController(pushController);
var userController = new UserController(pushController, toroController, pufferController, userProvider);
toroController.setUserController(userController);
var friendProvider = new FriendProvider();
var addressbookProvider = new AddressbookProvider();
var friendController = new FriendController();
pufferController.setUserController(userController);

app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function() {
  app.use(express.errorHandler());
});

// only called when its 200
var sendResponse = function (response, error, data) {
  var responseObj;
  if (error) {
    responseObj = {"ok": false, "error": error}
  } else {
    if (data !== undefined && data !== null) {
      var elementsArray;
      if (data instanceof Array) {
        elementsArray = data;
      } else if (typeof data === 'number') {
        elementsArray = [data];
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
  var username = request.body.username;
  var appName = request.body.app || constants.APPS.SNAPPERMAP;
  if (username) {
    username = username.toLowerCase();
    userController.authenticate(username, request.body.password, appName, function(error, user) {
      sendResponse(response, error, user);
    });
  } else {
    sendResponse(response, 'Did not include username in login request');
  }
});

app.post('/logout', function (request, response) {
  var username = request.body.username;
  if (username) {
    username = username.toLowerCase();
    var device_token = request.body.device_token;
    if (device_token) {
      userController.unregisterDeviceToken(username, device_token, function (error) {
        sendResponse(response, error);
      });
    } else {
      sendResponse(response, null, 'Successful');
    }
  } else {
    sendResponse(response, 'Did not include username in logout request');
  }
});

app.post('/users/new', function(request, response) {
  var username = request.body.username;
  var password = request.body.password;
  if (username && password) {
    username = username.toLowerCase();
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
            userController.save(username, request.body.password, email, request.body.phone, function(error, docs) {
              if (error) {
                sendResponse(response, error, docs);
              } else {
                friendController.addFriend(username, 'teamsnapper', function(error, friends) {
                  toroController.newToro('teamsnapper', username, 40.7577, -73.9857, 'Welcome to snapper map!', 'Times Square', '123', function(error, toro) {
                    sendResponse(response, error, docs);
                  });
                });
              }
            });
          }
        });
      }
    });
  }
});

app.get('/users', function(request, response) {
  userProvider.findAll(function(error, docs) {
    sendResponse(response, error, docs);
  });
});

app.get('/version', function(request, response) {
  sendResponse(response, null, "Version: 1.0.1");
});

app.get('/users/:username', function(request, response) {
  userProvider.findByUsername(request.params.username, function (error, docs) {
    sendResponse(response, error, docs);
  });
});

app.get('/users/migrate_password/:username', function(request, response) {
  userProvider.findByUsername(request.params.username, function (error, users) {
    if (users.length > 0) {
      var user = users[0];
      if (user.salt === "" || user.salt === undefined || user.salt === null) {
        userController.migratePassword(user, function(error, user) {
          sendResponse(response, error, user);
        });
      } else {
        sendResponse(response, 'already migrated', user);
      }
    }
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

app.put('/users/device_token/:username/:device_token', function (request, response) {
  userController.registerDeviceToken(request.params.username, request.params.device_token, function (error) {
    sendResponse(response, error, null);
  });
});

app.del('/users/device_token/:username/:device_token', function (request, response) {
  userController.unregisterDeviceToken(request.params.username, request.params.device_token, function (error) {
    sendResponse(response, error, null);
  });
});

app.post('/users/reset_badge_count/:username', function (request, response) {
  userController.resetBadgeCount(request.params.username, constants.APPS.SNAPPERMAP, function (error, responseBody) {
    sendResponse(response, error, responseBody);
  });
});

app.post('/users/reset_badge_count/:app/:username', function (request, response) {
  userController.resetBadgeCount(request.params.username, request.params.app, function (error, responseBody) {
    sendResponse(response, error, responseBody);
  });
});

app.get('/users/get_badge_count/:username', function (request, response) {
  userController.getBadgeCount(request.params.username, constants.APPS.SNAPPERMAP, function (error, count) {
    sendResponse(response, error, count);
  });
});

app.get('/users/get_badge_count/:app/:username', function (request, response) {
  if (request.params.app === constants.APPS.SNAPPERMAP) {
    userController.getBadgeCount(request.params.username, request.params.app, function (error, count) {
      sendResponse(response, error, count);
    });
  } else if (request.params.app === constants.APPS.PUFFERCHAT) {
    pufferController.getBadgeCount(request.params.username, function(error, count) {
      sendResponse(response, error, count);
    });
  }
});

app.get('/addressbooks/:username', function(request, response) {
  var username = request.params.username;
  userProvider.findByUsername(username, function (error, existing_users) {
    if (error) {
      sendResponse(response, error, null);
    } else if (existing_users.length == 0) {
      sendResponse(response, util.format('User "%s" does not exist', username), null);
    } else {
      addressbookProvider.findByUsername(username, function(error, results) {
        sendResponse(response, error, results);
      });
    }
  });
});

app.post('/addressbooks/upload', function(request, response) {
  var username = request.body.username;
  userProvider.findByUsername(username, function (error, existing_users) {
    if (error) {
      sendResponse(response, error, null);
    } else if (existing_users.length == 0) {
      sendResponse(response, util.format('User "%s" does not exist', username), null);
    } else {
      addressbookProvider.save(request.body, function(error, results) {
        sendResponse(response, error, results);
      });
    }
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
  if (latitude && longitude && sender && receiver) {
    if (sender === receiver) {
      sendResponse(response, 'You cannot send a snapper to yourself.', null);
    } else {
      if (latitude >= -90.0 && latitude <= 90.0 && longitude >= -180.0 && longitude <= 180.0) {
        userProvider.findOneByUsername(sender, function(error, result) {
          if (error) {
            sendResponse(response, error);
          } else if (result) {
            userProvider.findOneByUsername(receiver, function(error, result) {
              if (error) {
                sendResponse(response, error);
              } else if (result) {
                toroController.newToro(sender, receiver, latitude, longitude, request.body.message, request.body.venue, request.body.venueID, function(error, toro) {
                  sendResponse(response, error, toro);
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
    }
  } else {
    sendResponse(response, "Request missing one of required attributes: latitude, longitude, sender or receiver.");
  }
});

app.get('/toros/received/:user_id', function (request, response) {
  toroController.findByReceiver(request.params.user_id, function (error, docs) {
    sendResponse(response, error, docs);
  });
});

app.get('/toros/sent/:user_id', function (request, response) {
  toroController.findBySender(request.params.user_id, function (error, toros) {
    sendResponse(response, error, toros);
  });
});

app.get('/toros/:user_id', function(request, response) {
  toroController.findBySenderOrReceiver(request.params.user_id, function (error, toros) {
    sendResponse(response, error, toros);
  });
});

app.put('/toros/set_read/:toro_id', function(request, response) {
  var read = request.body.read;
  if (read === null || read === undefined) { // Setting read without parameters sets read to true.
    read = true;
  }
  var toro_id = request.params.toro_id;
  toroController.findById(toro_id, function(error, toro) {
    if (toro) {
      toroController.setRead(toro, read, function(error, toro) {
        sendResponse(response, error, toro);
      });
    } else {
      sendResponse(response, 'Could not find toro.', null);
    }
  });
});

app.put('/toros/update/:toro_id', function (request, response) {
  toroProvider.update(request.params.toro_id, request.body, function(error) {
    sendResponse(response, error, null);
  });
});

app.post('/puffers/new', function (request, response) {
  var sender = request.body.sender;
  var receiver = request.body.receiver;
  var receivers = request.body.receivers;
  var image = request.body.image;
  var duration = request.body.duration;
  var message = request.body.message;

  if (receiver && !receivers) {
    receivers = [receiver];
  }
  if (image && sender && receivers && duration) {
    if (isNaN(duration) || duration <= 0) {
      sendResponse(respone, util.format('Duration "%d" is not a valid duration.'));
    } else {
      userProvider.findOneByUsername(sender, function(error, senderResult) {
        if (error) {
          sendResponse(response, error);
        } else {
          async.map(receivers, function(receiver, callback) {
            if (sender === receiver) {
              callback('You cannot send a puffer to yourself.');
            } else if (senderResult) {
              userProvider.findOneByUsername(receiver, function(error, receiverResult) {
                if (error) {
                  callback(error);
                } else if (receiverResult) {
                  callback(null, {
                    sender: sender,
                    receiver: receiver,
                    image: image,
                    duration: duration,
                    message: message,
                    read: false,
                    expired: false
                  });
                } else {
                  callback(util.format("User %s does not exist.", receiver));
                }
              });
            }
          }, function(error, results) {
            if (error) {
              sendResponse(response, error, results);
            } else {
              pufferController.newPuffer(results, function(error, pufferResults) {
                sendResponse(response, error, pufferResults);
              });
            }
          });
        }
      });
    }
  } else {
    sendResponse(response, "Request missing one of required attributes: sender, receiver(s), image, or duration.");
  }
});

app.get('/puffers/received/:user_id', function (request, response) {
  pufferController.findByReceiver(request.params.user_id, function (error, puffers) {
    sendResponse(response, error, puffers);
  });
});

app.get('/puffers/sent/:user_id', function (request, response) {
  pufferController.findBySender(request.params.user_id, function (error, puffers) {
    sendResponse(response, error, puffers);
  });
});

app.get('/puffers/:user_id', function(request, response) {
  pufferController.findBySenderOrReceiver(request.params.user_id, function (error, puffers) {
    sendResponse(response, error, puffers);
  });
});

app.put('/puffers/set_read/:puffer_id', function(request, response) {
  var read = request.body.read;
  if (read === null || read === undefined) { // Setting read without parameters sets read to true.
    read = true;
  }
  var puffer_id = request.params.puffer_id;
  pufferController.findById(puffer_id, function(error, puffer) {
    if (puffer) {
      pufferController.setRead(puffer, read, function(error, puffer) {
        sendResponse(response, error, puffer);
      });
    } else {
      sendResponse(response, 'Could not find puffer.', null);
    }
  });
});

app.put('/puffers/expire/:puffer_id', function(request, response) {
  var expired = request.body.expired;
  pufferController.expire(request.params.puffer_id, expired, function(error, result) {
    sendResponse(response, error, result);
  });
});

app.put('/puffers/update/:puffer_id', function(request, response) {
  pufferProvider.update(request.params.puffer_id, request.body, function(error) {
    sendResponse(response, error, null);
  });
});

app.get('/puffers/get_badge_count/:username', function (request, response) {
  pufferController.getBadgeCount(request.params.username, function(error, count) {
    sendResponse(response, error, count);
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

app.put('/friends/:user_id/:friend_user_id', function(request, response) {
  var user_id = request.params.user_id;
  var friend_user_id = request.params.friend_user_id;
  if (user_id && friend_user_id) {
    user_id = user_id.toLowerCase();
    friend_user_id = friend_user_id.toLowerCase();
    friendController.addFriend(user_id, friend_user_id, function(error, friends) {
      sendResponse(response, error, friends);
    });
  }
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
