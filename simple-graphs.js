DataEvents = new Mongo.Collection('dataEvents');

var keyValueArray = function(obj) {
  var array = [];
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop))
      array.push({key: prop, value: obj[prop]})
  }
  return array;
}

if (Meteor.isClient) {

  Template.table_of_data.helpers({
    dataEventAggregates: function() {
      var events = DataEvents.find({});
      var sums = {};

      events.forEach(function (eventPoint) {
        var aggregate = sums[eventPoint.category] || 0;
        aggregate += eventPoint.amount;
        sums[eventPoint.category] = aggregate;
      });

      return keyValueArray(sums);
    }
  });

  Template.table_of_data.events({
    'click #dataEventsTable button': function (e) {
      var td = e.currentTarget;
      var category = td.attributes['data-category'].value;

      Meteor.call('deleteAllEventsForCategory', category, function(error, result) {
        if (error) { console.log('ERROR:', error)}
      });
    }
  });

  Template.generate_random_data.helpers({

  });

  Template.generate_random_data.events({
    'submit #generateDataForm': function (e, t) {

      // Collect the form data
      var amountOfData = t.find('#amountOfData').value;
      var categoryOfData = t.find('#categoryOfData').value;

      console.log(amountOfData);

      var inserted = DataEvents.insert({
          amount: Number(amountOfData),
          category: categoryOfData
      });

      console.log('Inserted:', inserted);

      // Clear the form
      t.find('#amountOfData').value = '';
      t.find('#categoryOfData').value = '';

      // Prevent chain
      console.log('Saved: ' + amountOfData + ' to ' + categoryOfData);
      return false;
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });

  DataEvents.allow({
    update: function(userId, document, fields, modifier){
      return true;
    },
    insert: function(userId, document, fields, modifier){
      return true;
    },
    remove: function(userId, document, fields, modifier){
      return true;
    }
  });

  Meteor.methods({
  deleteAllEventsForCategory: function (category) {
    check(category, String);
    console.log('Deleting: ', category);
    DataEvents.remove({category: category});
  }
});
}
