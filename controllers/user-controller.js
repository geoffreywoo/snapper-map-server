var https = require('https'),
    util = require('util'),
    request = require('request'),
    constants = require('../constants');

var urban_airship_host = 'go.urbanairship.com';
var urban_airship_appkey = '6w6o7r7RQue9QAbyg6tN2Q';
var urban_airship_appsecret = 'gd_o2UPsQMGzxXQ3sktDWw';
var urban_airship_mastersecret = 'E2xaw_GMTUWaTUXY_PlD3A';

UserController = function(pushController, toroController, pufferController, userProvider) {
  this.pushController = pushController;
  this.toroController = toroController;
  this.pufferController = pufferController;
  this.userProvider = userProvider;
};

UserController.prototype.checkUserExistsError = function(username, callback) {
  this.userProvider.findByUsername(username, function(error, users) {
    if (error) {
      callback(error);
    } else if (users.length === 0) {
      callback(util.format('User "%s" does not exist.', username));
    } else {
      callback(null);
    }
  });
};

UserController.prototype.registerDeviceToken = function(username, app, device_token, callback) {
  pushController.enqueueDeviceTokenRequest(username, app, constants.CLIENT_APP_MODES.DEVELOPMENT, device_token);
  pushController.enqueueDeviceTokenRequest(username, app, constants.CLIENT_APP_MODES.PRODUCTION, device_token);
}

UserController.prototype.unregisterDeviceToken = function(username, device_token, callback) {
  var options = {
    hostname: urban_airship_host,
    path: util.format('/api/device_tokens/%s', device_token),
    method: 'DELETE',
    auth: util.format('%s:%s', urban_airship_appkey, urban_airship_appsecret)
  };
  var request = https.request(options, function(response) {
    response.on('end', function() {
      callback(null);
    });
  });
  request.end();
}

UserController.prototype.getBadgeCount = function(username, app, callback) {
  var controller;
  if (app === constants.APPS.SNAPPERMAP) {
    controller = this.toroController;
  } else if (app === constants.APPS.PUFFERCHAT) {
    controller = this.pufferController;
  } else {
    controller = this.toroController;
  }
  controller.findByReceiverUnread(username, function(error, toros) {
    if (error) {
      callback(error);
    } else if (toros) {
      callback(error, toros.length);
    } else {
      callback(util.format('Toros object could not be gotten for username %s', username));
    }
  });
}

UserController.prototype.resetBadgeCount = function(username, app, callback) {
  this.getBadgeCount(username, app, function(error, count) {
    if (error) {
      callback('Could not get the correct badge count!', null);
    } else {
      console.log(util.format('Resetting badge count for user %s to: %d', username, count));
      this.pushController.setBadgeCount(username, app, count);
      callback(null);
    }
  }.bind(this));
}

exports.UserController = UserController