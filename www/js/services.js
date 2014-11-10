angular.module('starter.services', [])

    .filter('millisecondsToStringFilter', function() {
        return function(milliseconds) {
            if (milliseconds !== 0 && !milliseconds) return "";

            var seconds = Math.floor(milliseconds / 1000);
            milliseconds = Math.floor((milliseconds % 1000)/100);
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
            durationString += zeroPad(hours, 2) + ':' + zeroPad(minutes, 2) + ':' + zeroPad(seconds, 2) + "   " + zeroPad(milliseconds, 2);
            return durationString;
        };
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

    .filter('humanize', ['moment', function(moment){
        moment.locale('en', {
            calendar : {
                lastDay : '[Yesterday]',
                sameDay : '[Today]',
                lastWeek : '[Last] dddd LL',
                sameElse : 'LL'
            }
        });

        return function(date){
            return moment(date).calendar();
        };
    }])

    .service('ActivitiesService', function(){
        var tags = {
    "Coding": {
        objectTags: ["self"],
        actionTags: ["code"]
    },
    "Commuting": {
        objectTags: ["self"],
        actionTags: ["commute"]
    },
    "Cooking": {
        objectTags: ["food"],
        actionTags: ["cook"]
    },
    "Exercising": {
        objectTags: ["self"],
        actionTags: ["exercise"]
    },
    "Meditating": {
        objectTags: ["self"],
        actionTags: ["meditate"]
    },
    "Meetings": {
        objectTags: ["self"],
        actionTags: ["meet"]
    },
    "Partying": {
        objectTags: ["self"],
        actionTags: ["party"]
    },
    "Playing Instrument": {
        objectTags: ["instrument"],
        actionTags: ["play"]
    },
    "Playing computer game": {
        objectTags: ["computer"],
        actionTags: ["play"]
    },
    "Reading": {
        objectTags: ["text"],
        actionTags: ["read"]
    },
    "Sitting": {
        objectTags: ["self"],
        actionTags: ["sit"]
    },
    "Sleeping": {
        objectTags: ["self"],
        actionTags: ["sleep"]
    },
    "Standing": {
        objectTags: ["self"],
        actionTags: ["stand"]
    },
    "Studying": {
        objectTags: ["self"],
        actionTags: ["study"]
    },
    "Tooth brushing": {
        objectTags: ["teeth"],
        actionTags: ["brush"]
    },
    "Tooth flossing": {
        objectTags: ["teeth"],
        actionTags: ["floss"]
    },
    "TV watching ": {
        objectTags: ["tv"],
        actionTags: ["watch"]
    },
    "Working": {
        objectTags: ["self"],
        actionTags: ["work"]
    },
    "Writing": {
        objectTags: ["text"],
        actionTags: ["write"]
    }
},

        activities = (function(){
            var activities_list = [];
            Object.keys(tags).forEach(function(key){
                activities_list.push(
                    {title: key, duration: 0}
                );
            });
            return activities_list;
        })(),

        getTags = function(activity_name){
            return tags[activity_name];
        },

        listActivities = function(){
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
                activity.interval = $interval(updateActivityTime, 100);
                status.running = true;
                status.startDate = activity.startDate;
            } else {
                status.duration = activity.duration;
                status.running = false;
                status.startDate = activity.startDate;
                $interval.cancel(activity.interval);
                activity.duration = status.duration;
                delete activity.interval;
                delete activity.startDate;
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
            
            window.localStorage.last_event_sent_index = new_last_sent_index;
        },

        getLastSentIndex = function(){
            return parseInt(window.localStorage.last_event_sent_index);
        },

        getUnsentEvents = function(){
            var queue = getQueue(),
            last_event_sent_index = getLastSentIndex(),
            queue_length = queue.length;

            return queue.slice(last_event_sent_index + 1, queue_length);
        },

        sendEvents = function(){
            var api_credentials = angular.fromJson(window.localStorage.api_credentials),
            api_headers = {'Authorization': api_credentials.writeToken,
                           'Content-Type': 'application/json'
                          },

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
                var api_events = [],
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
                
                $timeout(poller, 5000);
            };
            
            poller();
        };

        return {
            queueEvent: queueEvent,
            sendEvents: sendEvents,
            getQueue: getQueue
        };
        
    })

    .service('AuthenticationService', function($http, API, $ionicPopup, ActivityEventService, $cordovaToast){
        var showDisclaimer = function(force_show){
            var api_credentials = window.localStorage.api_credentials;

            if(typeof api_credentials === 'undefined' || force_show){
                var confirmPopup = $ionicPopup.confirm({
                    title: 'Duration Data Policy',
                    template: "1self Duration uses the 1self cloud to show you smart visualizations of your activity. Once connected you can also share and correlate your data. Your raw data will never be shown and it won't be possible to tell who you are or where you've been. Would you like to connect Duration to the 1self cloud?"
                });
                confirmPopup.then(function(res) {
                    if(res) {
                        console.log("Authenticated, yay!");
                        registerStream();
                        $cordovaToast.show("Authenticating...", 'long', 'bottom')
                    } else {
                        window.localStorage.api_credentials = 'Not authenticated';
                        console.log('Not authenticated :(');
                    }
                });
            }
        },

        auth_headers = {'Authorization': API.clientId + ":" + API.clientSecret},
        registerStream = function(){
            $http.post(API.endpoint + "/v1/streams", {}, {headers: auth_headers})
                .success(function(data){
                    window.localStorage.api_credentials = angular.toJson(data);
                    window.localStorage.last_event_sent_index = -1;

                    //a continuous service to send pending events
                    ActivityEventService.sendEvents();

                    $cordovaToast.show("Authenticated", 'long', 'bottom')
                })
                .error(function(data, status, headers, config) {
                    //try again next time :(
                });
        },

        authenticated = function(){
            var api_credentials = window.localStorage.api_credentials;
            return (api_credentials !== "Not authenticated") && (typeof api_credentials !== 'undefined');
        };

        return {
            authenticate: showDisclaimer,
            authenticated: authenticated
        };

    });