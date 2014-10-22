angular.module('starter.services', [])

.filter('millisecondsToStringFilter', function() {
  return function(milliseconds) {
    if(!milliseconds) return "";

    var seconds = Math.floor(milliseconds / 1000);
    var minutes = Math.floor(seconds / 60);
    seconds = seconds - (minutes * 60);
    var hours = Math.floor(minutes / 60);
    minutes = minutes - (hours * 60);

    var zeroPad = function(num, numZeros) {
      var n = Math.abs(num);
      var zeros = Math.max(0, numZeros - Math.floor(n).toString().length);
      var zeroString = Math.pow(10, zeros).toString().substr(1);
      if (num < 0) {
        zeroString = '-' + zeroString;
      }
      return zeroString + n;
    }

    var durationString = '';
    durationString += zeroPad(hours,2) + ':' + zeroPad(minutes,2) + ':' + zeroPad(seconds,2);
    return durationString;
  };
})

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

    var status = {
      running: false,
      duration: 0,
      title: activity.title,
      startDate: null
    };

    if (!activity.interval) {
      activity.startDate = moment();
      updateActivityTime();
      activity.interval = $interval(updateActivityTime, 1000);
      status.running = true;
      status.startDate = activity.startDate;
    } else {
      status.duration = activity.duration;
      status.running = false;
      status.startDate = activity.startDate;
      $interval.cancel(activity.interval);
      delete activity.interval;
    }
    return status;
  };

  var getAllActivities = function() {
    return activities;
  }

  var getStatus = function(activity) {
    return {
      title: activity.title,
      duration: activity.duration
    };
  };

  return {
    toggleActivity: toggleActivity,
    getAllActivities: getAllActivities,
    getStatus: getStatus
  };

})

.service('ActivityEventService', function() {
  var queueEvent = function(activity) {
    var queueString = window.localStorage['events'];
    console.log(queueString);

    if (queueString) {
      var queue = angular.fromJson(queueString);
      queue.push(activity);
      window.localStorage['events'] = angular.toJson(queue);
    } else {
      window.localStorage['events'] = angular.toJson([activity]);
    }
  };

  var sendEventLoop = function() {
    //Listen and transmit
  };

  return {
    queueEvent: queueEvent
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