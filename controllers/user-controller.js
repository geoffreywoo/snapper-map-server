var https = require('https'),
    util = require('util');

var urban_airship_host = 'go.urbanairship.com';
var urban_airship_appkey = '6w6o7r7RQue9QAbyg6tN2Q';
var urban_airship_appsecret = 'gd_o2UPsQMGzxXQ3sktDWw';
var urban_airship_mastersecret = 'E2xaw_GMTUWaTUXY_PlD3A';
UserController = function() {
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

UserController.prototype.resetBadgeCount = function(username) {
  toroProvider.find({'_id': ObjectID(toro_id)}, {}, function(error, result) {
    if (!error && read && result && result.length > 0 && result[0].receiver) {
      receiver = result[0].receiver;
      toroProvider.findByReceiverUnread(receiver, function(error, toros) {
        if (!error) {
          pushController.setBadgeCount(receiver, toros.length, function() {});
        }
      });
    }
  });
}

exports.UserController = UserController