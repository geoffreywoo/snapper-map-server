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
    this.checkAndExpirePuffer(puffer_data, function(error, success, result) {
      var output_data = puffer_data;
      var timestamp = puffer_data.created_at;
      if (typeof(timestamp) == "object" &&
          typeof(timestamp.getTime == "function")) {
        output_data.created_at = timestamp.getTime() / 1000;
      }
      callback(null, output_data);
    });
  } else {
    callback(util.format('Puffer data "%s" could not be processed.', puffer_data));
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

PufferController.prototype.expire = function (puffer, expired, callback) {
  if (expired === null || expired === undefined) { // Setting read without parameters sets expired to true.
    expired = true;
  }

  this.imageController.transitionPhoto(puffer.id, function (error, result) {
    this.pufferProvider.update(puffer.id, {"expired":expired}, function(error) {
      this.pufferProvider.find({'_id': ObjectID(puffer.id)}, {}, function(error, result) {
        if (!error && expired && result && result.length > 0 && result[0].receiver) {
          receiver = result[0].receiver;
          userController.resetBadgeCount(receiver, 'pufferchat', function (error, responseBody) {
            if (error) {
              console.log(error);// if push notification doesn't work just log it
            }
            callback(null, result);
          });
        } else {
          callback(error, result);
        }
      });
    }.bind(this));
  }.bind(this));


};

PufferController.prototype.checkAndExpirePuffer = function (puffer, callback) {
  if (!puffer.expired && puffer.created_at.getTime() + puffer.duration * 1000 < new Date().getTime()) {
    this.expire(puffer, true, function(error, result) {
      if (error) {
        callback(error, false, result);
      } else {
        puffer.expired = true;
        callback(null, true);
      }
    });
  } else {
    callback(null, false);
  }
};

PufferController.prototype.newPuffer = function (sender, receiver, image, message, duration, callback) {
  var pushController = this.pushController;
  var userController = this.userController;
  this.pufferProvider.save({
    sender: sender,
    receiver: receiver,
    image: image,
    message: message,
    duration: duration,
    read: false,
    expired: false
  }, function(error, docs) {
    if (error) {
      callback(error);
    } else {
      userController.getBadgeCount(receiver, 'pufferchat', function (error, count) {
        if (error) {
          console.log(error);
          callback(null, docs); // don't send error if getting badge count failed.
        } else {
          pushController.sendNotification(receiver, 'pufferchat', util.format('from %s', sender), count, function (error, responseBody) {
            if (error) {
              console.log(error);
            }
            callback(null, docs); // don't send error if push failed.
          });
        }
      });
    }
  });
};

exports.PufferController = PufferController;