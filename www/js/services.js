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

    .filter('humanize', ['moment', function(moment){
        moment.locale('en', {
            calendar : {
                lastDay : '[Tomorrow]',
                sameDay : '[Today]',
                nextDay : '[Yesterday]',
                lastWeek : '[last] dddd LL',
                nextWeek : 'dddd LL',
                sameElse : 'LL'
            }
        });

        return function(date){
            return moment().calendar(date);
        };
    }])

    .filter('groupByDate', function(){
        function memoize(func) {
            var memo = {};
            var slice = Array.prototype.slice;

            return function() {
                var args = slice.call(arguments);

                if (args in memo)
                    return memo[args];
                else
                    return (memo[args] = func.apply(this, args));

            }
        }
        return memoize(function(events){
            var groups = {};
            angular.forEach(events, function(event){
                var date = event.dateTime.split('T')[0];
                if(!groups[date]){
                    groups[date] = [];
                }
                
                groups[date].push(event);
            });

            return groups;
        });
    })

    .filter('buildEventFilter', function() {
        return function(activity, status) {
            return {
                "activity": activity.title,
                "dateTime": status.startDate,
                "duration": status.duration/1000
            };
        };
    })

    .service('ActivitiesService', function(){
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

        var tags = {
            "Meditate": {
                objectTags: ['self'],
                actionTags: ['meditate']
            },
            "Exercise":{
                objectTags: ['self'],
                actionTags: ['exercise']
            },
            "Meetings":{
                objectTags: ['self'],
                actionTags: ['meet']
            },
            "Tooth brushing": {
                objectTags: ['teeth'],
                actionTags: ['brush']
            },
            "Sleeping":{
                objectTags: ['self'],
                actionTags: ['sleep']
            },
            "Coding":{
                objectTags: ['self'],
                actionTags: ['code']
            }
        };

        var getTags = function(activity_name){
            return tags[activity_name];
        };

        var listActivities = function(){
            return activities;
        };

        return {
            listActivities: listActivities,
            getTags: getTags
        };
    })

    .service('ActivityTimingService', function(moment, $interval, ActivitiesService) {
        var activities = ActivitiesService.listActivities();

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

    .service('ActivityEventService', function($http, $timeout, API, $filter, ActivitiesService) {
        var getQueue = function() {
            var queueString = window.localStorage.events;
            if (queueString) {
                return angular.fromJson(queueString);
            } else {
                return [];
            }
        },

        queueEvent = function(activity) {
            var queue = getQueue();
            queue.push(activity);
            window.localStorage.events = angular.toJson(queue);
        },

        updateLastSentIndex = function(number_of_sent){
            var last_index = getLastSentIndex(),
            new_last_sent_index = last_index + number_of_sent;
            
            window.localStorage['last_event_sent_index'] = new_last_sent_index;
        },

        getLastSentIndex = function(){
            return parseInt(window.localStorage['last_event_sent_index']) || -1;
        },

        getUnsentEvents = function(){
            var queue = getQueue(),
            last_event_sent_index = getLastSentIndex(),
            queue_length = queue.length;

            return queue.slice(last_event_sent_index + 1, queue_length);
        },

        sendEvents = function(){
            var api_credentials = angular.fromJson(window.localStorage.api_credentials),

            buildAPIEvent = function(event){
                var tags = ActivitiesService.getTags(event.activity);
                return {
                    "dateTime": event.dateTime,
                    "streamid": api_credentials.streamid,
                    "source": "Timer App",
                    "version": "0.0.1",
                    "objectTags": tags.objectTags,
                    "actionTags": tags.actionTags,
                    "properties": {
                        "duration": event.duration
                    }
                };
            },

            poller = function() {
                if(typeof api_credentials == 'undefined'){
                    api_credentials = angular.fromJson(window.localStorage.api_credentials);
                    console.log("Waiting for stream registration");
                }else{

                    var api_headers = {'Authorization': api_credentials.writeToken,
                                       'Content-Type': 'application/json'
                                      },

                    api_events = [],
                    events = getUnsentEvents();

                    if(0 != events.length){
                        for(i=0; i < events.length; i++){
                            api_events.push(buildAPIEvent(events[i]));
                        }
                        
                        $http.post(API.endpoint + "/v1/streams/" + api_credentials.streamid + '/events/batch', 
                                   api_events, {headers: api_headers})
                            .success(function(data) {
                                updateLastSentIndex(api_events.length);
                            })
                        
                            .error(function(data){
                                //do nothing
                            });
                    }
                }
                
                $timeout(poller, 5000);
            };
            
            poller();
        };

        return {
            queueEvent: queueEvent,
            sendEvents: sendEvents,
            getQueue: getQueue
        };
        
    });