var FriendProvider = require('../friendprovider').FriendProvider,

FriendController = function() {
  this.friendProvider = new FriendProvider();
  this.userProvider = new UserProvider();
}

FriendController.prototype.addFriend = function(user_id, friend_user_id, callback) {
  var userProvider = this.userProvider;
  var friendProvider = this.friendProvider;
  if (user_id && friend_user_id) {
    if (user_id === friend_user_id) {
      callback(util.format('User "%s" cannot add self as friend.', user_id));
    } else {
      userProvider.findByUsername(user_id, function(error, results) {
        if (error || results.length == 0) {
          callback(util.format('User "%s" was not found.', user_id));
        } else {
          userProvider.findByUsername(friend_user_id, function(error, results) {
            if (error || results.length == 0) {
              callback(util.format('User "%s" was not found.', friend_user_id));
            } else {
              friendProvider.save(user_id, {"user_id": friend_user_id, "blocked": false}, function(error, friends) {
                if (error) {
                  callback(error);
                } else {
                  friendProvider.save(friend_user_id, {"user_id": user_id, "blocked": false}, function(error) {
                    callback(error, friends);
                  });
                }
              });
            }
          });
        }
      });
    }
  } else {
    error(util.format('Must pass in a valid user_id and friend_user_id parameter.'));
  }
}

exports.FriendController = FriendController;