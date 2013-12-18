var util = require('util'),
    UserProvider = require('../userprovider').UserProvider,
    ToroProvider = require('../toroprovider').ToroProvider;
    constants = require('../constants');

function ToroController(pushController) {
  SendableController.call(this, pushController, constants.APPS.SNAPPERMAP);
  this.toroProvider = new ToroProvider();
  this.userProvider = new UserProvider();
  this.pushController = pushController;
};

util.inherits(ToroController, SendableController);

ToroController.prototype.getProvider = function() {
  return this.toroProvider;
};

ToroController.prototype.outputData = function (toro_data, callback) {
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

ToroController.prototype.newToro = function (sender, receiver, latitude, longitude, message, venue, venueID, callback) {
  var toroProvider = this.toroProvider;
  var userController = this.userController;
  var pushController = this.pushController;
  toroProvider.save({
    latitude: latitude,
    longitude: longitude,
    sender: sender,
    receiver: receiver,
    message: message,
    venue: venue,
    venueID: venueID,
    read:false
  }, function(error, docs) {
    if (error) {
      callback(error);
    } else {
      userController.getBadgeCount(receiver, constants.APPS.SNAPPERMAP, function (error, count) {
        if (error) {
          console.log(error);
          callback(null, docs); // don't send error if getting badge count failed.
        } else {
          pushController.sendNotification(receiver, constants.APPS.SNAPPERMAP, util.format('from %s', sender), count);
          callback(null, docs); // don't send error if push failed.
        }
      });
    }
  });
}

exports.ToroController = ToroController;