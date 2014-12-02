angular.module('duration.controllers', [])

    .controller('DashCtrl', function($scope, $ionicModal, $cordovaToast, $filter, $ionicPopup, $timeout, ActivityTimingService, EventSendService, API, ActivitiesService) {

	var activities = $filter('showSelectedActivities')(ActivitiesService.listActivities());

        $scope.activities = [];

        for(i = 0; i < activities.length; i++){
            var updated_activity = ActivityTimingService.updateActivity(activities[i]);
            $scope.activities.push(updated_activity);
        }

	$scope.toggleActivity = function(activity) {
	    var activity = ActivityTimingService.updateActivity(activity, "toggle");

        if (!activity.interval) {
            var durationString = $filter('millisecondsToStringFilter')(activity.duration); 
            var durationParts = durationString.split(':');

            var queueEvent = function(res) {
                if(!res) return;

                activity.duration = res;

                var message = activity.title + " for " + $filter('durationPartFilter')($filter('millisecondsToStringFilter')(activity.duration));
                try {
                    $scope.showToast(message);
                } catch (e) {
                    console.error(e);
                }

                var event = $filter('buildEventFilter')(activity);
                EventSendService.queueEvent(event);
            };

            $scope.showEditPopup = function() {
                $scope.data = {
                    duration: {
                        hours: parseInt(durationParts[0], 10),
                        minutes: parseInt(durationParts[1], 10),
                        seconds: parseInt(durationParts[2], 10),
                        milliseconds: parseInt(durationParts[3], 10)
                    }
                };

                var editPopupTemplate = 'Hours : Minutes : Seconds<br><input type="number" size="2" min="0" ng-model="data.duration.hours"/><input type="number" size="2" min="0" max="60" ng-model="data.duration.minutes"/><input type="number" size="2" min="0" max="60" ng-model="data.duration.seconds"/>';

                var editPopup = $ionicPopup.show({
                    template: editPopupTemplate,
                    title: 'Edit duration',
                    subTitle: 'Please confirm the time to log',
                    scope: $scope,
                    buttons: [{
                        text: 'Cancel'
                    }, {
                        text: '<b>Log</b>',
                        type: 'button-positive',
                        onTap: function(e) {
                            return $scope.data.duration.hours*3600000 + $scope.data.duration.minutes*60000 + $scope.data.duration.seconds*1000 + $scope.data.duration.milliseconds;
                        }
                    }, ]
                });
                editPopup.then(queueEvent);
            };

        $scope.showEditPopup();
        }
    }

	$scope.showToast = function(message) {
	    $cordovaToast.show(message, 'short', 'bottom')
		.then(function(success) {
		    console.log("The toast was shown");
		}, function(error) {
		    console.log("The toast was not shown due to " + error);
		});
	};
    })

    .controller('DashEditCtrl', ['$scope', '$location', '$ionicNavBarDelegate','UserPreferenceService', function($scope, $location, $ionicNavBarDelegate, UserPreferenceService){
        $scope.activities = UserPreferenceService.loadPreferences("activities");
        $scope.change = function(index){
            console.log($scope.activities);
            UserPreferenceService.setPreference("activities", $scope.activities);
        };

        $scope.goBack = function() {
            $ionicNavBarDelegate.back();
        }
    }])

    .controller('HistoryCtrl', function(moment, $scope, EventSendService) {
        var grouped_events = (function(){
            var events = EventSendService.getQueue();
            var groups = {};
            events.forEach(function(event){
                var date = event.dateTime.split('T')[0];
                if(!groups[date]){
                    groups[date] = [];
                }
                
                groups[date].unshift(event);
            });

            return groups;
        })();
        
        $scope.events = grouped_events;
        $scope.event_dates = Object.keys(grouped_events).sort().reverse();

        $scope.format_time = function(secs, type){
            var duration = moment.duration(secs * 1000);
            return duration[type]();
        };
    })



    .controller('ChartsCtrl', function($scope, $location, API, ActivitiesService, AuthenticationService) {
        $scope.activities = ActivitiesService.listActivities(true);
        $scope.chart = {};

        var init = function() {
            if(!AuthenticationService.authenticated()) {
                //show
                AuthenticationService.authenticate(true, function(res){
                    if(!res) $location.path('/dash');
                });
            }
        };
        init();

        $scope.showChart =  function(){
            var activity = $scope.chart.type;
            var api_credentials = angular.fromJson(window.localStorage.api_credentials),
            tags = ActivitiesService.getTags(activity),
            uri = API.endpoint + "/v1/streams/" +
                api_credentials.streamid + "/events/" +
                tags.objectTags.join(',') + "/" +
                tags.actionTags.join(',') +
                "/sum(duration)/daily/barchart?readToken=" + 
                api_credentials.readToken;

            window.open(uri, '_blank', 'location=no,toolbar=yes,closebuttoncaption=Back to App');
        };
    });
