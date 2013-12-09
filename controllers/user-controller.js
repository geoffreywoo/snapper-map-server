var https = require('https'),
    util = require('util'),
    constants = require('../constants');

var urban_airship_host = 'go.urbanairship.com';
var urban_airship_appkey = '6w6o7r7RQue9QAbyg6tN2Q';
var urban_airship_appsecret = 'gd_o2UPsQMGzxXQ3sktDWw';
var urban_airship_mastersecret = 'E2xaw_GMTUWaTUXY_PlD3A';

UserController = function(pushController, toroController, pufferController) {
  this.pushController = pushController;
  this.toroController = toroController;
  this.pufferController = pufferController;
};

UserController.prototype.registerDeviceToken = function(username, device_token, callback) {
  var body = JSON.stringify({
    'alias': username
  });
  var options = {
    hostname: urban_airship_host,
    path: util.format('/api/device_tokens/%s/', device_token),
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': body.length
    },
    auth: util.format('%s:%s', urban_airship_appkey, urban_airship_appsecret)
  };

  var request = https.request(options, function(response) {
    var statusCode = response.statusCode;
    if (statusCode == 200 || statusCode == 201) {
      callback(null);
    } else {
      callback(util.format('Airship API failed and returned code: %d', statusCode));
    }
  });
  request.on('error', function (error) {
    callback(error);
  });
  request.write(body);
  request.end();
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
      this.pushController.setBadgeCount(username, app, count, function(error, responseBody) {
        callback(error, responseBody);
      });
    }
  }).bind(this);
}

exports.UserController = UserController