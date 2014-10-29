angular.module('starter.services', [])

    .filter('millisecondsToStringFilter', function() {
        return function(milliseconds) {
            if (!milliseconds) return "";

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
            durationString += zeroPad(hours, 2) + ':' + zeroPad(minutes, 2) + ':' + zeroPad(seconds, 2);
            return durationString;
        };
    })

    .filter('toEventFilter', function() {
        return function(activity, status) {
            var api_credentials = angular.fromJson(window.localStorage.api_credentials);
            return {
                "dateTime": status.startDate,
                "streamid": api_credentials.streamid,
                "source": "Timer App",
                "version": "0.0.1",
                "objectTags": activity.objectTags,
                "actionTags": activity.actionTags,
                "properties": {
                    "duration": status.duration/1000
                }
            };
        };
    })

    .service('ActivityTimingService', function(moment, $interval) {
        var activities = [{
            title: 'Meditate',
            objectTags: ['self'],
            actionTags: ['meditate']
        }, {
            title: 'Exercise',
            objectTags: ['self'],
            actionTags: ['exercise']
        }, {
            title: 'Meetings',
            objectTags: ['self'],
            actionTags: ['meet']
        }, {
            title: 'Tooth brushing',
            objectTags: ['teeth'],
            actionTags: ['brush']
        }, {
            title: 'Sleeping',
            objectTags: ['self'],
            actionTags: ['sleep']
        }, {
            title: 'Coding',
            objectTags: ['self'],
            actionTags: ['code']
        }];

        var toggleActivity = function(activity) {
            var updateActivityTime = function() {
                var elapsedTime = moment.duration(moment().diff(activity.startDate));
                activity.duration = elapsedTime.asMilliseconds();
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
                delete activity.startDate;
                delete activity.duration;
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
    .service('ActivityEventService', function($http, $timeout, API) {
        var getQueue = function() {
            var queueString = window.localStorage['events'];
            if (queueString) {
                return angular.fromJson(queueString);
            } else {
                return [];
            }
        };

        var queueEvent = function(activity) {
            var queue = getQueue();
            queue.push(activity);
            window.localStorage['events'] = angular.toJson(queue);
        };

        var popQueue = function(){
            var queue = getQueue();
            queue.shift();
            window.localStorage['events'] = angular.toJson(queue);
        }

        var sendEvents = function(){
            var api_credentials = angular.fromJson(window.localStorage.api_credentials),
            api_headers = {'Authorization': api_credentials.writeToken,
                           'Content-Type': 'application/json'
                          },

            poller = function() {
                getQueue().forEach(function(elem){

                    $http.post(API.endpoint + "/v1/streams/" + api_credentials.streamid + '/events', 
                               elem, {headers: api_headers})
                        .success(function(data) {
                            popQueue();
                        })
                    
                        .error(function(data){
                            //do nothing
                        });
                });

                $timeout(poller, 5000);
            }

            poller();
        };

        return {
            queueEvent: queueEvent,
            sendEvents: sendEvents
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