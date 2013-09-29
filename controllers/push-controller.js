var https = require('https'),
    util = require('util');

var urban_airship_host = 'go.urbanairship.com';
var urban_airship_appkey = '6w6o7r7RQue9QAbyg6tN2Q';
var urban_airship_appsecret = 'gd_o2UPsQMGzxXQ3sktDWw';
var urban_airship_mastersecret = 'E2xaw_GMTUWaTUXY_PlD3A';
PushController = function() {
};

var makePushRequest = function(body, callback) {
  var request_body = JSON.stringify(body);
  var options = {
    hostname: urban_airship_host,
    path: util.format('/api/push/'),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': request_body.length,
      'Accept': 'application/vnd.urbanairship+json; version=3;'
    },
    auth: util.format('%s:%s', urban_airship_appkey, urban_airship_mastersecret)
  };
  console.log('hi');
  var request = https.request(options, function(response) {
    var statusCode = response.statusCode;
    console.log('eh');
    console.log(util.format('responseCode: %d', statusCode));
    if (statusCode >= 200 && statusCode <= 203) {
      callback(null);
    } else {
      callback(util.format('Airship response code was: %d', statusCode));
    }
  });
  console.log('aaa');
  request.write(request_body);
  request.on('error', function (error) {
    callback(error);
  });
  request.end();
}

PushController.prototype.setBadgeCount = function(username, count, callback) {
  console.log(util.format('count is: %d', count));
  makePushRequest({
    'audience': {
      'alias': username
    },
    'notification': {
      'ios': {
        'badge': count,
      }
    },
    'device_types': ['ios']
  }, callback);
}

PushController.prototype.sendNotification = function(username, message, callback) {
  makePushRequest({
    'audience': {
      'alias': username
    },
    'notification': {
      'ios': {
        'badge': '+1',
        'alert': message,
        'sound': 'default'
      }
    },
    'device_types': ['ios']
  }, callback);
}

exports.PushController = PushController