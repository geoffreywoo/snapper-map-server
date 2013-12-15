var util = require('util'),
    UserProvider = require('../userprovider').UserProvider,
    PufferProvider = require('../pufferprovider').PufferProvider,
    async = require('async'),
    ImageController = require('./image-controller').ImageController;

PufferController = function(pushController) {
  this.pufferProvider = new PufferProvider();
  this.userProvider = new UserProvider();
  this.pushController = pushController;
  this.imageController = new ImageController();
};

PufferController.prototype.setUserController = function (userController) {
  this.userController = userController;
};

PufferController.prototype.outputPuffer = function(puffer_data, callback) {
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

PufferController.prototype.outputPuffers = function(puffer_datas, callback) {
  if (typeof(puffer_datas.length) === "undefined") {
    callback(util.format('Puffer datas "%s" could not be processed.', puffer_datas));
  } else {
    async.map(puffer_datas, this.outputPuffer.bind(this), callback);
  }
};

PufferController.prototype.checkUserExistsError = function(username, callback) {
  this.userProvider.findByUsername(username, function(error, users) {
    if (error) {
      callback(error);
    } else if (users.length === 0) {
      callback(util.format('User "%s" does not exist.', username));
    } else {
      callback(null);
    }
  });
};

PufferController.prototype.findById = function(id, callback) {
  this.pufferProvider.find({'_id': ObjectID(id)}, {}, function(error, puffers) {
    if (error) {
      callback(error);
    } else if (puffers && puffers.length > 0) {
      callback(null, puffers[0]);
    } else {
      callback(util.format("Couldn't find puffer with id: %s", id));
    }
  });
};

PufferController.prototype.findByReceiver = function(username, callback) {
  this.checkUserExistsError(username, function(error) {
    if (error) {
      callback(error);
    } else {
      this.pufferProvider.findByReceiver(username, function (error, puffers) {
        if (error) {
          callback(error);
        } else {
          this.outputPuffers(puffers, function (error, output) {
            callback(error, output);
          }.bind(this));
        }
      }.bind(this), {'created_at': -1});
    }
  }.bind(this));
};

PufferController.prototype.findByReceiverUnread = function(username, callback) {
  this.checkUserExistsError(username, function(error) {
    if (error) {
      callback(error);
    } else {
      this.pufferProvider.findByReceiverUnread(username, function (error, Puffers) {
        if (error) {
          callback(error);
        } else {
          this.outputPuffers(Puffers, function (error, output) {
            callback(error, output);
          }.bind(this));
        }
      }.bind(this), {'created_at': -1});
    }
  }.bind(this));
};

PufferController.prototype.findBySender = function(username, callback) {
  this.checkUserExistsError(username, function(error) {
    if (error) {
      callback(error);
    } else {
      this.pufferProvider.findBySender(username, function (error, puffers) {
        if (error) {
          callback(error);
        } else {
          this.outputPuffers(puffers, function (error, output) {
            callback(error, output);
          }.bind(this));
        }
      }.bind(this), {'created_at': -1});
    }
  }.bind(this));
};

PufferController.prototype.findBySenderOrReceiver = function(username, callback) {
  this.checkUserExistsError(username, function(error) {
    if (error) {
      callback(error);
    } else {
      this.pufferProvider.findBySenderOrReceiver(username, function (error, Puffers) {
        if (error) {
          callback(error);
        } else {
          this.outputPuffers(Puffers, function (error, output) {
            callback(error, output);
          }.bind(this));
        }
      }.bind(this), {'created_at': -1});
    }
  }.bind(this));
};

PufferController.prototype.set_read = function(puffer, read, callback) {
  this.pufferProvider.update(puffer._id, {"read": read}, function(error) {
    if (!error) {
      this.resetBadgeCount(puffer.receiver);
    }
    callback(error);
  }.bind(this));
}

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

PufferController.prototype.resetBadgeCount = function(username) {
  this.getBadgeCount(username, function(error, count) {
    if (error) {
      console.log(util.format('Error resetting badge count: %s', error));
    } else {
      this.pushController.setBadgeCount(username, constants.APPS.PUFFERCHAT, count);
    }
  }.bind(this));
};

PufferController.prototype.getBadgeCount = function(username, callback) {
  this.findByReceiverUnread(username, function(error, puffers) {
    if (error) {
      callback(error);
    } else if (puffers) {
      callback(error, puffers.length);
    } else {
      callback(util.format('Puffers object could not be gotten for username %s', username));
    }
  });
};

PufferController.prototype.sendPushesForPuffers = function(puffers) {
  async.each(puffers, function(puffer, callback) {
    this.getBadgeCount(puffer.receiver, function (error, count) {
      if (!error) {
        this.pushController.sendNotification(puffer.receiver, constants.APPS.PUFFERCHAT, util.format('from %s', puffer.sender), count);
      }
      callback(error);
    }.bind(this));
  }.bind(this));
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

exports.PufferController = PufferController;