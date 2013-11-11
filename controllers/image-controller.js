var https = require('https'),
    util = require('util');

var image_server_host = 'images.snappierchat.com';

ImageController = function() {
};

// operation either upload, delete, blur
// method is either put, post, or get
var makeRequest = function(body, method, content_type, host, path, callback) {
  var headers = {};
  var request_body;
  if (body) {
    if (content_type == 'application/json') {
      request_body = JSON.stringify(body);
    }
    
  }
  if (content_type) {
    headers['Content-Type'] = content_type;
  }
  if (request_body) {
    headers['Content-Length'] = request_body.length;
  } else {
    headers['Content-Length'] = 0;
  }
  var options = {
    hostname: urbanairship_options.host,
    path: util.format('/%s/', operation),
    method: method,
    headers: headers
  };
  var request = http.request(options, function (response) {
    var statusCode = response.statusCode;
    if (statusCode >= 200 && statusCode < 300) {
      response.on('data', function(chunk) {
        callback(null, chunk);
      });
    } else {
      response.on('data', function(chunk) {
        callback(util.format('Response code was: %d', statusCode), chunk);
      });
    }
  });
  request.write(request_body);
  request.on('error', function (error) {
    callback(error, null);
  });
  request.end();
}

ImageController.prototype.blurPhoto = function(photoId, callback) {
  makeRequest(null, 'PUT', null, 'blur', image_server_host, callback);
}

exports.ImageController = ImageController