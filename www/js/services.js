angular.module('duration.services', [])

    .filter('millisecondsToStringFilter', function() {
        return function(milliseconds) {
            if (milliseconds !== 0 && !milliseconds) return "";

            var seconds = Math.floor(milliseconds / 1000);
            milliseconds = Math.floor((milliseconds % 1000) / 100);
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
            durationString += zeroPad(hours, 2) + ':' + zeroPad(minutes, 2) + ':' + zeroPad(seconds, 2) + ":" + zeroPad(milliseconds, 2);
            return durationString;
        };
    })

    .filter('durationPartFilter', function() {
        return function(str) {
            return str.substr(0, 8);
        }
    })
    .filter('tenthsPartFilter', function() {
        return function(str) {
            return str.substr(9, str.length);
        }
    })


    .filter('buildEventFilter', function() {		
        return function(activity) {		
            return {		
                "activity": activity.title,		
                "dateTime": activity.startDate,		
                "duration": activity.duration/1000		
            };		
        };		
    })

    .filter('humanize', ['moment', function(moment) {
        moment.locale('en', {
            calendar: {
                lastDay: '[Yesterday]',
                sameDay: '[Today]',
                lastWeek: '[Last] dddd LL',
                sameElse: 'LL'
            }
        });

        return function(date) {
            return moment(date).calendar();
        };
    }])

    .service('ActivitiesService', function() {
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

        activities = (function() {
            var activities_list = [];
            Object.keys(tags).forEach(function(key) {
                activities_list.push({
                    title: key,
                    duration: 0
                });
            });
            return activities_list;
        })(),

        getTags = function(activity_name) {
            return tags[activity_name];
        },

        listActivities = function() {
            return activities;
        };

        return {
            listActivities: listActivities,
            getTags: getTags
        };
    })

    .service('ActivityTimingService', function(moment, $interval, ActivitiesService) {
        var updateActivity = function(activity, action) {
            var updateActivityTime = function() {
                var elapsedTime = moment.duration(moment().diff(activity.startDate));
                activity.duration = elapsedTime.asMilliseconds();
            },

            getActiveActivities = function(){
                var active_activities = window.localStorage.active_activities;
                if (active_activities) {
                    return angular.fromJson(active_activities);
                } else {
                    return {};
                }
            },

            storeActiveActivity = function(activity){
                var active_activities = getActiveActivities();
                active_activities[activity.title] = {startDate: activity.startDate};
                window.localStorage.active_activities = angular.toJson(active_activities);
            },

            removeActiveActivity = function(activity){
                var active_activities = getActiveActivities();
                delete active_activities[activity.title];
                window.localStorage.active_activities = angular.toJson(active_activities);
            },

            toggleActivity = function(){
                if (!activity.interval) {
                    activity.startDate = moment();
                    updateActivityTime();
                    activity.interval = $interval(updateActivityTime, 100);
                    storeActiveActivity(activity);
                } else {
                    $interval.cancel(activity.interval);
                    delete activity.interval;
                    removeActiveActivity(activity);
                }
            },

            updateActiveActivity = function(){
                var active_activities = getActiveActivities();
                if(activity.title in active_activities){
                    activity.startDate = active_activities[activity.title].startDate;

                    //cancel any previous intervals (if, any)
                    $interval.cancel(activity.interval);

                    //create new
                    updateActivityTime();
                    activity.interval = $interval(updateActivityTime, 100);
                }
            };

            //main
            if("toggle" == action){
                toggleActivity();
            }
            else{
                updateActiveActivity();
            }

            return activity;
        };

        return {
            updateActivity: updateActivity
        };

    })

    .service('EventSendService', function($http, $timeout, API, $filter, ActivitiesService) {
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

        updateLastSentIndex = function(number_of_sent) {
            var last_index = getLastSentIndex(),
            new_last_sent_index = last_index + number_of_sent;
            
            window.localStorage.last_event_sent_index = new_last_sent_index;
        },

        getLastSentIndex = function(){
            var last_event_sent_index = window.localStorage.last_event_sent_index;
            if(typeof last_event_sent_index == 'undefined'){
                return -1;
            }else{
                return parseInt(last_event_sent_index);
            }
        },

        getUnsentEvents = function() {
            var queue = getQueue(),
            last_event_sent_index = getLastSentIndex(),
            queue_length = queue.length;

            return queue.slice(last_event_sent_index + 1, queue_length);
        },

        sendEvents = function() {
            var api_credentials = angular.fromJson(window.localStorage.api_credentials),
            api_headers = {
                'Authorization': api_credentials.writeToken,
                'Content-Type': 'application/json'
            },

            buildAPIEvent = function(event) {
                var tags = ActivitiesService.getTags(event.activity);
                return {
                    "dateTime": event.dateTime,
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

                if (0 != events.length) {
                    for (i = 0; i < events.length; i++) {
                        api_events.push(buildAPIEvent(events[i]));
                    }
                    
                    $http.post(API.endpoint + "/v1/streams/" + api_credentials.streamid + '/events/batch', 
                               api_events, {
                                   headers: api_headers
                               })
                        .success(function(data) {
                            updateLastSentIndex(api_events.length);
                        })
                    
                        .error(function(data) {
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

    .service('AuthenticationService', function($http, API, $ionicPopup, $cordovaToast, EventSendService){
        var showDisclaimer = function(force_show, callback) {
            var onConfirm = function(res) {
                if (res) {
                    console.log("Authenticated, yay!");
                    registerStream();
                    try {
                        $cordovaToast.show("Authenticating...", 'long', 'bottom');
                    } catch (e) {
                        console.error(new Error(e));
                    }
                } else {
                    window.localStorage.api_credentials = 'Not authenticated';
                    console.log('Not authenticated :(');
                }
                if(callback) callback(res);
            };
            var api_credentials = window.localStorage.api_credentials;

            if (typeof api_credentials === 'undefined' || force_show) {
                var confirmPopup = $ionicPopup.confirm({
                    title: 'Duration Data Policy',
                    template: "<style>.button-continue{background-color: #00b8e7;}</style><p>1self Duration uses the 1self cloud to show you smart visualizations of your activity. Once connected you can also share and correlate your data. Your raw data will never be shown and it won't be possible to tell who you are or where you've been. Would you like to connect Duration to the 1self cloud?</p>",
                    buttons: [{
                        text: 'No thanks',
                        onTap: function(e) {
                            onConfirm(false);
                        }
                    }, {
                        text: 'Continue',
                        type: 'button-continue',
                        onTap: function(e) {
                            onConfirm(true);
                        }
                    }]
                });
            }
        },

        auth_headers = {
            'Authorization': API.clientId + ":" + API.clientSecret
        },
        registerStream = function() {
            $http.post(API.endpoint + "/v1/streams", {}, {
                headers: auth_headers
            })
                .success(function(data) {
                    window.localStorage.api_credentials = angular.toJson(data);
                    window.localStorage.last_event_sent_index = -1;

                    //a continuous service to send pending events
                    EventSendService.sendEvents();

            try {
                $cordovaToast.show("Authenticated", 'long', 'bottom')
            } catch (e) {
                console.error(new Error(e));
            }
                })
                .error(function(data, status, headers, config) {
                    //try again next time :(
                });
        },

        authenticated = function() {
            var api_credentials = window.localStorage.api_credentials;
            return (api_credentials !== "Not authenticated") && (typeof api_credentials !== 'undefined');
        };

        return {
            authenticate: showDisclaimer,
            authenticated: authenticated
        };

    });