var mongo = require('mongodb'),
    Db = mongo.Db,
    Connection = mongo.Connection,
    Server = mongo.Server,
    BSON = mongo.BSON,
    ObjectID = mongo.ObjectID,
    util = require('util');

UserProvider = function() {
  this.dbProvider = new DBProvider();
};

var normalizePhone = function(phone) {
  if (!phone) {
    return phone;
  }
  normalized = phone.replace(/\D/g, '');
  if (normalized.length == 11 && normalized[0] == '1') {
    return normalized.substr(1);
  } else {
    return normalized;
  }
}

//find all Users
UserProvider.prototype.findAll = function(callback) {
  this.dbProvider.getCollection('Users', function(error, user_collection) {
    if(error) callback(error);
    else {
      user_collection.find().toArray(function(error, results) {
        if (error) {
          callback(error);
        } else {
          callback(null, results);
        }
      });
    }
  });
};

UserProvider.prototype.findOneByUsername = function (username, callback) {
  this.dbProvider.getCollection('Users', function (error, user_collection) {
    if (error) {
      callback(error);
    } else {
      user_collection.findOne({"_id":username}, function(error, result) {
        if(error) {
          callback(error);
        } else if (result) {
          callback(null, result);
        } else {
          user_collection.findOne({"username":username}, function(error, result) {
            callback(null, result);
          });
        }
      });
    }
  });
}

//find by username
UserProvider.prototype.findByUsername = function(username, callback) {
  this.dbProvider.getCollection('Users', function (error, user_collection) {
    if(error) callback(error);
    else {
      user_collection.find({"_id":username}).toArray(function(error, results) {
        if(error) callback(error);
        else if (results.length > 0) {
          callback(null, results);
        } else {
          user_collection.find({"username":username}).toArray(function(error, results) {
            callback(null, results);
          });
        }
      });
    }
  });
};

//find by username
UserProvider.prototype.findByEmail = function (email, callback) {
  this.dbProvider.getCollection('Users', function (error, user_collection) {
    if (error) {
      callback(error);
    } else {
      user_collection.find({"email":email}).toArray(function(error, results) {
        if (error) {
          callback(error);
        } else {
          callback(null, results);
        }
      });
    }
  });
};

//save new User
UserProvider.prototype.save = function (users, callback) {
    this.dbProvider.getCollection('Users', function (error, user_collection) {
      if (error) {
        callback(error);
      }
      else {
        if( typeof(users.length)=="undefined")
          users = [users];

        for( var i =0;i< users.length;i++ ) {
          user = users[i];
          user["_id"] = user.username;
          user.created_at = new Date();
          user["phone"] = normalizePhone(user["phone"])
        }

        user_collection.insert(users, function() {
          callback(null, users);
        });
      }
    });
};

// address book auto-friending
UserProvider.prototype.addressBookMatch = function (phones, emails, callback) {
  this.dbProvider.getCollection('Users', function(error, user_collection) {
    if (error) {
      callback(error);
    } else {
      // normalize phone numbers
      var normalizedPhones = [];
      for (var i = 0; i < phones.length; i++) {
        normalizedPhones.push(normalizePhone(phones[i]));
      }
      user_collection.find({"$or":[{"phone":{"$in":normalizedPhones}}, {"email":{"$in":emails}}]}).toArray(function(error, results) {
        if (error) {
          callback(error);
        } else {
          callback(null, results);
        }
      });
    }
  });
};

UserProvider.prototype.update = function (user_id, updates, callback) {
  this.dbProvider.getCollection('Users', function (error, user_collection) {
    if (error) {
      callback(error);
    } else {
      updates["phone"] = user_utils.normalizePhone(updates["phone"])
      user_collection.update({"_id":user_id}, {"$set":updates}, function() {
        callback(null);
      });
    }
  });
};

UserProvider.prototype.remove = function(user_id, callback) {
  var dbProvider = this.dbProvider;
  this.findByUsername(user_id, function(error, results) {
    if (error) {
      callback(error);
    } else if (results.length == 0) {
      callback(util.format('User "%s" does not exist.', user_id));
    } else {
      dbProvider.getCollection('Users', function (error, user_collection) {
        if (error) {
          callback(error);
        } else {
          user_collection.remove({"_id":user_id}, function(error) {
            callback(error);
          });

        }
      });
    }
  });
}

exports.UserProvider = UserProvider;
