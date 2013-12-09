var http = require('http'),
    util = require('util'),
    request = require('request');

var image_server_host = 'images.snappierchat.com';

ImageController = function() {
};

ImageController.prototype.transitionPhoto = function(photoId, callback) {
  request({
    uri: util.format('http://images.snappierchat.com:1337/swap/%s', photoId),
    timeout: 600,
    method: 'PUT'
  }, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      callback(null, body);
    } else {
      callback(error, body);
    }
  });
}

exports.ImageController = ImageController