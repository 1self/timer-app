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

    .filter('showSelectedActivities',['UserPreferenceService', function(UserPreferenceService){
        return function(activities) {
            var shown_activities = [];
            var selected_activities = UserPreferenceService.loadPreferences("activities");
            for (var i = 0; i < selected_activities.length; i++) {
                if(selected_activities[i].selected == true){
                    for (var j = 0; j < activities.length; j++) {
                        if (activities[j].title == selected_activities[i].title) {
                            shown_activities.push(activities[j]);
                            break;
                        }
                    };
                }
            };
            return shown_activities;
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
            "Playing Games": {
                objectTags: ["computer", "games"],
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
            "Tooth Brushing": {
                objectTags: ["teeth"],
                actionTags: ["brush"]
            },
            "Tooth Flossing": {
                objectTags: ["teeth"],
                actionTags: ["floss"]
            },
            "TV Watching ": {
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

        create_activities = function(tag_list) {
            var activities_list = [];
            Object.keys(tag_list).forEach(function(key) {
                activities_list.push({
                    title: key,
                    duration: 0
                });
            });
            return activities_list;
        },

        activities = create_activities(tags),

        getTags = function(activity_name) {
            if (activity_name) {
                return tags[activity_name];
            } else {
                return tags;
            }
        },

        listActivities = function() {
            return activities;
        };

        return {
            listActivities: listActivities,
            getTags: getTags,
        };
    })
    
    .service('UserPreferenceService', ['ActivitiesService', function(ActivitiesService){

        var create_activities = function(tag_list) {
            var activities_list = [];
            Object.keys(tag_list).forEach(function(key) {
                activities_list.push({
                    title: key,
                    selected: true
                });
            });
            return activities_list;
        };

        var initialize = function() {
            if(!window.localStorage.user_preferences) {
                window.localStorage.user_preferences = angular.toJson({
                    "activities": create_activities(ActivitiesService.getTags())
                });
            }
        };

        var loadPreferences = function(key) {
            initialize();
            if (key) {
                return angular.fromJson(window.localStorage.user_preferences)[key];
            } else {
                return angular.fromJson(window.localStorage.user_preferences);
            }

        };
        var preferences = loadPreferences();

        var savePreferences = function() {
            window.localStorage.user_preferences = angular.toJson(preferences);
        };

        var setPreference = function(key, value) {
            preferences[key] = value;
            savePreferences();
        };

        return {
            initialize: initialize,
            loadPreferences: loadPreferences,
            setPreference: setPreference
        };
    }])

    .service('ActivityTimingService', function(moment, $interval, ActivitiesService, NotificationService) {
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
                    NotificationService.showNotification();
                    activity.startDate = moment();
                    updateActivityTime();
                    activity.interval = $interval(updateActivityTime, 100);
                    storeActiveActivity(activity);
                } else {
                    NotificationService.cancelNotification();
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
                    "source": API.appName,
                    "version": API.appVersion,
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
            'Authorization': API.appId + ":" + API.appSecret
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

    })
    .service('NotificationService', ['$ionicPlatform', function($ionicPlatform){

        var id = "1";
        var count = 0;
        if (window.localStorage.active_activities) {
            count = Object.keys(angular.fromJson(window.localStorage.active_activities)).length;
        }
        var showNotification = function() {
            try {
                $ionicPlatform.ready(function() {
                    count++;
                    id = window.plugin.notification.local.add({
                        id: id,
                        title: 'Duration',
                        message: 'Timer active',
                        date: new Date(),
                        ongoing: true,
                        badge: count
                    });
                });
            } catch (e) {
                console.error(new Error(e));
            }
        };

        var cancelNotification = function() {
            try {
                $ionicPlatform.ready(function() {
                    count--;
                    if (count === 0) {
                        window.plugin.notification.local.cancelAll();
                    }
                    else {
                        window.plugin.notification.local.add({
                            id: id,
                            title: 'Duration',
                            message: 'Timer active',
                            ongoing: true,
                            sound: null,
                            badge: count});
                    }
                });
            } catch (e) {
                console.error(new Error(e));
            }
        };

        return {
            showNotification: showNotification,
            cancelNotification: cancelNotification
        };
    }]);
