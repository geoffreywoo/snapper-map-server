var http = require('http'),
    util = require('util'),
    request = require('request'),
    constants = require('constants');

ImageController = function() {
};

ImageController.prototype.transitionPhoto = function(photoId, callback) {
  request({
    uri: util.format(constants.HOSTS.IMAGE_SERVICE, photoId),
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