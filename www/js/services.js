angular.module('starter.services', [])

.service('ActivityTimingService', function(moment, $interval) {
  var activities = [{
    title: 'Meditate'
  }, {
    title: 'Exercise'
  }, {
    title: 'Meetings'
  }, {
    title: 'Tooth brushing'
  }, {
    title: 'Sleeping'
  }, {
    title: 'Coding'
  }];

  var toggleActivity = function(activity) {
    var updateActivityTime = function() {
      var elapsedTime = moment.duration(moment().diff(activity.startDate));
      activity.duration = moment.utc(elapsedTime.asMilliseconds());
    };
    if (!activity.interval) {
      activity.startDate = moment();
      updateActivityTime();
      activity.interval = $interval(updateActivityTime, 1000);
    } else {
      delete activity.startDate;
      delete activity.duration;
      $interval.cancel(activity.interval);
      delete activity.interval;
    }
    console.log(activity);
    console.log("activities : " + JSON.stringify(activities));
  };

  var getAllActivities = function() {
    return activities;
  }

  return {
    toggleActivity: toggleActivity,
    getAllActivities: getAllActivities
  };

})

.factory('Friends', function() {
  // Might use a resource here that returns a JSON array

  // Some fake testing data
  var friends = [{
    id: 0,
    name: 'Scruff McGruff'
  }, {
    id: 1,
    name: 'G.I. Joe'
  }, {
    id: 2,
    name: 'Miss Frizzle'
  }, {
    id: 3,
    name: 'Ash Ketchum'
  }];

  return {
    all: function() {
      return friends;
    },
    get: function(friendId) {
      // Simple index lookup
      return friends[friendId];
    }
  }
});