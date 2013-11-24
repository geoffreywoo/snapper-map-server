var http = require('http'),
    util = require('util'),
    request = require('request');

var image_server_host = 'images.snappierchat.com';

ImageController = function() {
};

ImageController.prototype.transitionPhoto = function(photoId, callback) {
  request({
    uri: util.format('http://images.snappierchat.com/swap/%s', photoId),
    method: 'PUT'
  }, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      callback(null, body);
    } else {
      callback(error, body);
    }
  })

}

exports.ImageController = ImageController