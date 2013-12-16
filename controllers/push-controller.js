var util = require('util'),
    request = require('request'),
    async = require('async');

var app_mode = process.env.APP_MODE || 'development'

var urbanairship_options = {
  uri: 'https://go.urbanairship.com/api/push/',
  device_token_uri: 'https://go.urbanairship.com/api/device_tokens/%s',
  snappermap: {
    production: {
      appkey: 'RHYrm2hYTeKoT4C3JIyyHQ',
      appsecret: '633ZHRiESE23rSXgzWdK1Q',
      mastersecret: 'VkZ--zVCSfW78Gu5jyFwVg'
    },
    development: {
      appkey: '6w6o7r7RQue9QAbyg6tN2Q',
      appsecret: 'gd_o2UPsQMGzxXQ3sktDWw',
      mastersecret: 'E2xaw_GMTUWaTUXY_PlD3A'
    }
  },
  pufferchat: {
    production: {
      appkey: '2e4kjHZzQOevT8wz1dpZ-g',
      appsecret: 'M9uUvER4S9ypEmNVXLtMmA',
      mastersecret: '1M2ROeOGQquRIppSxa5sxw'
    },
    development: {
      appkey: 'DWehOd1hRrGgfJsiudQ3vw',
      appsecret: 'mS5AqSg2RS6wDVIg2X9Ojw',
      mastersecret: 'HMX_58EySFyF_BdYKdXxYw'
    }
  }
};

PushController = function() {
  this.pushQueue = async.queue(function (task, callback) {
    makePushRequest(task.body, task.app, callback);
  }, 4);
  this.deviceTokenQueue = async.queue(function (task, callback) {
    makeDeviceTokenRequest(task.username, task.app, task.device_token, callback);
  }, 2);
};

var makeDeviceTokenRequest = function(username, app, device_token) {
  var push_options = urbanairship_option[app][app_mode];
  request.put({
    body: JSON.stringify({
      alias: username
    }),
    uri: util.format(urbanairship_options.device_token_uri, device_token),
    headers: {
      'Content-Type': 'application/json'
    },
    auth: {
      user: push_options.appkey,
      pass: push_options.masterscret
    }
  }, function(error, response, body) {
    callback(error);
  });
};

var makePushRequest = function(body, app, callback) {
  var push_options = urbanairship_options[app][app_mode];
  request.post({
    uri: urbanairship_options.uri,
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Accept': 'application/vnd.urbanairship+json; version=3;'
    },
    auth: {
      'user': push_options.appkey,
      'pass': push_options.mastersecret
    }
  }, function(error, response, body) {
    callback(error);
  });
};

PushController.prototype.enqueueDeviceTokenRequest = function(username, app, device_token) {
  this.deviceTokenQueue.push({
    username: username,
    app: app,
    device_token: device_token
  }, function (error) {
    if (error) {
      console.log('Failed to complete task: ' + error);
    }
  });
};

// This enqueues a push request.
PushController.prototype.enqueuePushRequest = function(pushRequestBody, app) {
  this.pushQueue.push({
    body: pushRequestBody,
    app: app
  }, function(error) {
    if (error) {
      console.log('Failed to complete task: ' + error);
    }
  });
};

PushController.prototype.setBadgeCount = function(username, app, count) {
  this.enqueuePushRequest({
    'audience': {
      'alias': username
    },
    'notification': {
      'ios': {
        'badge': count
      }
    },
    'device_types': ['ios']
  }, app);
};

PushController.prototype.sendNotification = function(username, app, message, count) {
  this.enqueuePushRequest({
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
  }, app);
};

exports.PushController = PushController