var util = require('util'),
    UserProvider = require('../userprovider').UserProvider,
    async = require('async');

/**
 *  This prototype is abstract.
 */
SendableController = function(pushController, appName) {
  this.pushController = pushController;
  this.appName = appName;
};

SendableController.prototype.setUserController = function (userController) {
  this.userController = userController;
};

SendableController.prototype.getProvider = function() {
  throw "SendableController.getProvder is not implemented! Must override this function!";
};

/**
 * This method will transform and output the given data object. If you do not override
 * it will return the object as is.
 */
SendableController.prototype.outputData = function(data_object, callback) {
  if (data_object) {
    callback(null, data_object);
  } else {
    callback(util.format('Data object "%s" could not be processed.', data_object), null);
  }
};

/**
 * This method will output all the datas for the given object.
 * You should override outputData to specify actions to take on the data object
 * when outputing it.
 */
SendableController.prototype.outputDatas = function(data_objects, callback) {
  if (typeof(data_objects.length) === "undefined") {
    callback(util.format('Data objects "%s" could not be processed.', data_objects));
  } else {
    async.map(data_objects, this.outputData.bind(this), callback);
  }
};

SendableController.prototype.findById = function(id, callback) {
  this.getProvider().find({'_id': ObjectID(id)}, {}, function(error, data_object) {
    if (error) {
      callback(error);
    } else if (data_object && data_object.length > 0) {
      callback(null, data_object[0]);
    } else {
      callback(util.format("Couldn't find data object with id: %s", id));
    }
  });
};

SendableController.prototype.findByReceiver = function(username, callback) {
  this.userController.checkUserExistsError(username, function(error) {
    if (error) {
      callback(error);
    } else {
      this.getProvider().findByReceiver(username, function (error, sendable_objects) {
        if (error) {
          callback(error);
        } else {
          this.outputDatas(sendable_objects, function (error, output) {
            callback(error, output);
          }.bind(this));
        }
      }.bind(this), {'created_at': -1});
    }
  }.bind(this));
};

// TODO (tonygwu) refactor this.
SendableController.prototype.findByReceiverUnread = function(username, callback) {
  this.userController.checkUserExistsError(username, function(error) {
    if (error) {
      callback(error);
    } else {
      this.getProvider().findByReceiverUnread(username, function (error, sendable_objects) {
        if (error) {
          callback(error);
        } else {
          this.outputDatas(sendable_objects, function (error, output) {
            callback(error, output);
          }.bind(this));
        }
      }.bind(this), {'created_at': -1});
    }
  }.bind(this));
};

// TODO (tonygwu) refactor this with findByReceiver and findByReceiverUnread.
SendableController.prototype.findBySender = function(username, callback) {
  this.userController.checkUserExistsError(username, function(error) {
    if (error) {
      callback(error);
    } else {
      this.getProvider().findBySender(username, function (error, sendable_objects) {
        if (error) {
          callback(error);
        } else {
          this.outputDatas(sendable_objects, function (error, output) {
            callback(error, output);
          }.bind(this));
        }
      }.bind(this), {'created_at': -1});
    }
  }.bind(this));
};

// TODO (tonygwu) refactor this in the future.
SendableController.prototype.findBySenderOrReceiver = function(username, callback) {
  this.userController.checkUserExistsError(username, function(error) {
    if (error) {
      callback(error);
    } else {
      this.getProvider().findBySenderOrReceiver(username, function (error, sendable_objects) {
        if (error) {
          callback(error);
        } else {
          this.outputDatas(sendable_objects, function (error, output) {
            callback(error, output);
          }.bind(this));
        }
      }.bind(this), {'created_at': -1});
    }
  }.bind(this));
};

SendableController.prototype.setRead = function(sendable_object, read, callback) {
  if (sendable_object.read !== read) {
    this.getProvider().update(sendable_object._id, {"read": read}, function(error) {
      if (!error) {
        this.resetBadgeCount(sendable_object.receiver);
      }
      callback(error);
    }.bind(this));
  } else {
    callback(null);
  }
};

SendableController.prototype.getBadgeCount = function(username, callback) {
  this.findByReceiverUnread(username, function(error, sendable_objects) {
    if (error) {
      callback(error);
    } else if (sendable_objects) {
      callback(error, sendable_objects.length);
    } else {
      callback(util.format('Sendable object could not be gotten for username %s', username));
    }
  });
};

SendableController.prototype.resetBadgeCount = function(username) {
  this.getBadgeCount(username, function(error, count) {
    if (error) {
      console.log(util.format('Error resetting badge count: %s', error));
    } else {
        this.pushController.setBadgeCount(username, this.appName, count);
    }
  }.bind(this));
};

SendableController.prototype.sendPushesForSendables = function(sendable_objects) {
  async.each(sendable_objects, function(data_object, callback) {
    this.getBadgeCount(data_object.receiver, function (error, count) {
      if (!error) {
        this.pushController.sendNotification(data_object.receiver, this.appName, util.format('from %s', data_object.sender), count);
      }
      callback(error);
    }.bind(this));
  }.bind(this));
};

exports.SendableController = SendableController;