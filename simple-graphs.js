DataEvents = new Mongo.Collection('dataEvents');

var keyValueArray = function(obj) {
  var array = [];
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop))
      array.push({key: prop, value: obj[prop]})
  }
  return array;
}

var keyValueArrayCustomKeyValueName = function(obj, keyName, valueName) {
  var array = [];
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop))
      element = {}
      element[keyName] = prop;
      element[valueName] = obj[prop];
      array.push(element)
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

  Template.graph_by_category.rendered = function() {
    var w = 600;
    var h = 250;

    var xScale = d3.scale.ordinal().rangeRoundBands([0, w], 0.05);
    var yScale = d3.scale.linear().range([0, h]);

    var svg = d3.select("#chart").attr("width", w).attr("height", h);

    var key = function(doc) {
      return doc.category;
    }
    Deps.autorun(function() {
      var allData = DataEvents.find({}).fetch();

      var dataset = [];
      var sums = {};

      _.map(allData, function (eventPoint) {
        var aggregate = sums[eventPoint.category] || 0;
        aggregate += eventPoint.amount;
        sums[eventPoint.category] = aggregate;
      });

      console.log('allData', allData);
      console.log('sums', sums);

      dataset = keyValueArrayCustomKeyValueName(sums, 'category', 'amount');

      console.log('dataset', dataset);

      xScale.domain(d3.range(dataset.length));
      yScale.domain([0, d3.max(dataset, function(dataPoint) {
          return dataPoint.amount;
        })]);

      var bars = svg.selectAll("rect").data(dataset, key);

      bars.enter()
        .append("rect")
        .attr("x", w)
        .attr("y", function(d) {
          return h - yScale(d.amount);
        })
        .attr("width", xScale.rangeBand())
        .attr("height", function(d) {
          return yScale(d.amount);
        })
        .attr("fill", function(d) {
          return "rgb(0, 0, " + (d.amount * 10) + ")";
        })
        .attr("data-id", function(d) {
          return d._id;
        });

      bars.transition()
        .duration(500)
        .attr("x", function(d, i) {
          return xScale(i);
        })
        .attr("y", function(d) {
          return h - yScale(d.amount);
        })
        .attr("width", xScale.rangeBand())
        .attr("height", function(d) {
          return yScale(d.amount);
        })
        .attr("fill", function(d) {
          return "rgb(0, 0, " + (d.amount * 10) + ")";
        });

      bars.exit()
        .transition()
        .duration()
        .attr("x", -xScale.rangeBand())
        .remove();

    });
  };
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
