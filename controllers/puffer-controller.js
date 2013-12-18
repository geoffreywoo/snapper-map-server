var util = require('util'),
    UserProvider = require('../userprovider').UserProvider,
    PufferProvider = require('../pufferprovider').PufferProvider,
    async = require('async'),
    ImageController = require('./image-controller').ImageController,
    SendableController = require('./sendable-controller').SendableController,
    constants = require('../constants');

var computeDurationText = function(duration) {
  var durationLeft = duration;
  var unit;
  if ((durationLeft / 60) < 1) {
    unit = 's'
  } else {
    durationLeft /= 60;
    if ((durationLeft / 60) < 1) {
      unit = 'm';
    } else {
      durationLeft /= 60;
      if ((durationLeft / 24) < 1) {
        unit = 'h';
      } else {
        durationLeft /= 24;
        unit = 'd';
      }
    }
  }
  durationLeft = Math.floor(durationLeft);
  return util.format("%d%s", durationLeft, unit);
};

function PufferController(pushController) {
  SendableController.call(this, pushController, constants.APPS.PUFFERCHAT);
  this.pufferProvider = new PufferProvider();
  this.imageController = new ImageController();
};

util.inherits(PufferController, SendableController);

PufferController.prototype.getProvider = function() {
  return this.pufferProvider;
};

PufferController.prototype.outputData = function(puffer_data, callback) {
  if (puffer_data) {
    this.checkAndExpirePuffer(puffer_data, function(error, success) {
      var output_data = puffer_data;
      var timestamp = puffer_data.created_at;
      if (typeof(timestamp) == "object" &&
          typeof(timestamp.getTime == "function")) {
        output_data.created_at = timestamp.getTime() / 1000;
      }
      callback(null, output_data);
    });
  } else {
    callback(util.format('Puffer data "%s" could not be processed.', puffer_data), null);
  }
};

PufferController.prototype.expire = function (puffer, expired, callback) {
  if (expired === null || expired === undefined) { // Setting read without parameters sets expired to true.
    expired = true;
  }
  this.imageController.transitionPhoto(puffer.image, function (error, result) {
    this.pufferProvider.update(puffer._id, {"expired":expired}, callback);
  }.bind(this));
};

PufferController.prototype.checkAndExpirePuffer = function (puffer, callback) {
  if (!puffer.expired && puffer.created_at.getTime() + puffer.duration * 1000 < new Date().getTime()) {
    this.expire(puffer, true, function(error) {
      if (error) {
        callback(error, false);
      } else {
        puffer.expired = true;
        callback(null, true);
      }
    });
  } else {
    callback(null, false);
  }
};

PufferController.prototype.newPuffer = function (puffers, callback) {
  this.pufferProvider.save(puffers, function(error, puffers) {
    if (error) {
      callback(error);
    } else {
      this.sendPushesForPuffers(puffers);
      callback(null, puffers);
    }
  }.bind(this));
};

PufferController.prototype.sendPushesForPuffers = function(puffers) {
  async.each(puffers, function(puffer, callback) {
    this.getBadgeCount(puffer.receiver, function (error, count) {
      if (!error) {
        this.pushController.sendNotification(puffer.receiver, constants.APPS.PUFFERCHAT, util.format('from %s: %s to view.', puffer.sender, computeDurationText(puffer.duration)), count);
      }
      callback(error);
    }.bind(this));
  }.bind(this));
};

exports.PufferController = PufferController;