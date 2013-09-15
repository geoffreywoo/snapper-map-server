var util = require('util'),
    UserProvider = require('./userprovider').UserProvider,
    ToroProvider = require('./toroprovider').ToroProvider;

var outputToro = function(toro_data, callback) {
  if (toro_data) {
    var output_data = toro_data;
    var timestamp = toro_data.created_at;
    if (typeof(timestamp) == "object" &&
        typeof(timestamp.getTime == "function")) {
      output_data.created_at = timestamp.getTime() / 1000;
    }
    callback(null, output_data);
  } else {
    callback(util.format('Toro data "%s" could not be processed.', toro_data));
  }
};

var outputToros = function(toro_datas, callback) {
  if (toro_datas && toro_datas.length > 0) {
    var output_datas = new Array();
    for (var i = 0; i < toro_datas.length; i++) {
      var toro_data = toro_datas[i];
      outputToro(toro_data, function(error, toro_data) {
        if (error) {
          callback(error);
          return;
        } else {
          output_datas[i] = toro_data;
        }
      });
    }
    callback(null, output_datas);
  } else {
    callback(util.format('Toro datas "%s" could not be processed.', toro_datas));
  }
};

ToroController = function() {
  this.toroProvider = new ToroProvider();
  this.userProvider = new UserProvider();
};

ToroController.prototype.checkUserExistsError = function(username, callback) {
  this.userProvider.findByUsername(username, function(error, users) {
    if (error) {
      callback(error);
    } else if (users.length === 0) {
      callback(util.format('User "%s" does not exist.', username));
    } else {
      callback(null);
    }
  });
}

ToroController.prototype.findByReceiver = function(username, callback) {
  var toroProvider = this.toroProvider;
  this.checkUserExistsError(username, function(error) {
    if (error) {
      callback(error);
    } else {
      toroProvider.findByReceiver(username, function (error, toros) {
        if (error) {
          callback(error);
        } else {
          outputToros(toros, function (error, output) {
            callback(error, output);
          });
        }
      }, {'created_at': -1});
    }
  });
};

ToroController.prototype.findBySender = function(username, callback) {
  var toroProvider = this.toroProvider;
  this.checkUserExistsError(username, function(error) {
    if (error) {
      callback(error);
    } else {
      toroProvider.findBySender(username, function (error, toros) {
        if (error) {
          callback(error);
        } else {
          outputToros(toros, function (error, output) {
            callback(error, output);
          });
        }
      }, {'created_at': -1});
    }
  });
};

ToroController.prototype.findBySenderOrReceiver = function(username, callback) {
  var toroProvider = this.toroProvider;
  this.checkUserExistsError(username, function(error) {
    if (error) {
      callback(error);
    } else {
      toroProvider.findBySenderOrReceiver(username, function (error, toros) {
        if (error) {
          callback(error);
        } else {
          outputToros(toros, function (error, output) {
            callback(error, output);
          });
        }
      }, {'created_at': -1});
    }
  });
};

exports.ToroController = ToroController;