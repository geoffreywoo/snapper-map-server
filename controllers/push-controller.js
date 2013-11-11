var https = require('https'),
    util = require('util');

var urbanairship_options = {
  'host': 'go.urbanairship.com',
  'snappermap': {
    'production': {
      'appkey': 'RHYrm2hYTeKoT4C3JIyyHQ',
      'appsecret': '633ZHRiESE23rSXgzWdK1Q',
      'mastersecret': 'VkZ--zVCSfW78Gu5jyFwVg'
    },
    'development': {
      'appkey': '6w6o7r7RQue9QAbyg6tN2Q',
      'appsecret': 'gd_o2UPsQMGzxXQ3sktDWw',
      'mastersecret': 'E2xaw_GMTUWaTUXY_PlD3A'
    }
  },
  'pufferchat': {
    'production': {
      'appkey': '2e4kjHZzQOevT8wz1dpZ-g',
      'appsecret': 'M9uUvER4S9ypEmNVXLtMmA',
      'mastersecret': '1M2ROeOGQquRIppSxa5sxw'
    },
    'development': {
      'appkey': 'DWehOd1hRrGgfJsiudQ3vw',
      'appsecret': 'mS5AqSg2RS6wDVIg2X9Ojw',
      'mastersecret': 'HMX_58EySFyF_BdYKdXxYw'
    }
  }
}
var urban_airship_host = 'go.urbanairship.com';
var urban_airship_appkey = '6w6o7r7RQue9QAbyg6tN2Q';
var urban_airship_appsecret = 'gd_o2UPsQMGzxXQ3sktDWw';
var urban_airship_mastersecret = 'E2xaw_GMTUWaTUXY_PlD3A';
PushController = function() {
};

var makePushRequest = function(body, app, callback) {
  var request_body = JSON.stringify(body);
  var options = {
    hostname: urbanairship_options.host,
    path: util.format('/api/push/'),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': request_body.length,
      'Accept': 'application/vnd.urbanairship+json; version=3;'
    },
    auth: util.format('%s:%s', urban_airship_appkey, urban_airship_mastersecret)
  };
  var request = https.request(options, function (response) {
    var statusCode = response.statusCode;
    if (statusCode >= 200 && statusCode <= 203) {
      response.on('data', function(chunk) {
        callback(null, chunk);
      });
    } else {
      response.on('data', function(chunk) {
        callback(util.format('Airship response code was: %d', statusCode), chunk);
      });
    }
  });
  request.write(request_body);
  request.on('error', function (error) {
    callback(error, null);
  });
  request.end();
}

PushController.prototype.setBadgeCount = function(username, app, count, callback) {
  makePushRequest({
    'audience': {
      'alias': username
    },
    'notification': {
      'ios': {
        'badge': count
      }
    },
    'device_types': ['ios']
  }, app, callback);
}

PushController.prototype.sendNotification = function(username, app, message, count, callback) {
  makePushRequest({
    'audience': {
      'alias': username
    },
    'notification': {
      'ios': {
        'badge': count,
        'alert': message,
        'sound': 'default'
      }
    },
    'device_types': ['ios']
  }, app, callback);
}

exports.PushController = PushController