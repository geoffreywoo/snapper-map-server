var https = require('https'),
    util = require('util');

var urban_airship_host = 'go.urbanairship.com';
var urban_airship_appkey = '6w6o7r7RQue9QAbyg6tN2Q';
var urban_airship_appsecret = 'gd_o2UPsQMGzxXQ3sktDWw';
var urban_airship_mastersecret = 'E2xaw_GMTUWaTUXY_PlD3A';
PushController = function() {
};

PushController.prototype.sendNotification = function(username, message, callback) {
  var post_body = JSON.stringify({
    'audience': {
      'alias': username
    },
    'notification': {
      'alert': message,
    },
    'device_types': ['ios']
  });
  var options = {
    hostname: urban_airship_host,
    path: util.format('/api/push/'),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': post_body.length,
      'Accept': 'application/vnd.urbanairship+json; version=3;'
    },
    auth: util.format('%s:%s', urban_airship_appkey, urban_airship_mastersecret)
  };
  var request = https.request(options, function(response) {
    var statusCode = response.statusCode;
    if (statusCode >= 200 && statusCode <= 203) {
      callback(null);
    } else {
      callback(util.format('Airship response code was: %d', statusCode));
    }
  });
  request.write(post_body);
  request.on('error', function (error) {
    callback(error);
  });
  request.end();
}

exports.PushController = PushController