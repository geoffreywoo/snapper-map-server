var Db = require('mongodb').Db;
    Connection = require('mongodb').Connection,
    Server = require('mongodb').Server,
    BSON = require('mongodb').BSON,
    ObjectID = require('mongodb').ObjectID,
    MongoURI = require('mongo-uri'),
    util = require('util'),
    userUtils = require('./user_utils');

AddressbookProvider = function() {
  this.dbProvider = new DBProvider();
};

// AddressBooks is structured like [{"user_id":"jonochang", "AddressBooks":["tonygwu", "geoffwoo"]}]

//find all AddressBooks
AddressbookProvider.prototype.findByUsername = function(username, callback) {
  this.dbProvider.getCollection('Addressbooks', function (error, addressbook_collection) {
    if (error) {
      callback(error);
    } else {
      addressbook_collection.find({"username": username}).toArray(function(error, results) {
        if (error) {
          callback(error)
        } else if (results.length > 0) {
          callback(null, results);
        } else {
          callback(util.format('User "%s" has no uploaded addressbooks.', username), null);
        }
      });
    }
  });
};

//save new Addressbook
AddressbookProvider.prototype.save = function (address_books, callback) {
    this.dbProvider.getCollection('Addressbooks', function (error, addressbook_collection) {
      if (error) {
        callback(error);
      } else {
        if (typeof(address_books.length)=="undefined") {
          address_books = [address_books];
        }
        for (var i = 0; i< address_books.length; i++) {
          address_book = address_books[i];
          address_book["_id"] = address_book.user_id;
          address_book.timestamp = new Date();
          var phones = address_book.contacts["phone"]
          for (var i = 0; i < phones; i++) {
            phones[i] = userUtils.normalizePhone(phones[i]);
          }
        }
        addressbook_collection.insert(address_books, function() {
          callback(null, address_books);
        });
      }
    });
};

exports.AddressbookProvider = AddressbookProvider;
