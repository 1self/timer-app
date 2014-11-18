angular.module('duration.controllers', [])

    .controller('DashCtrl', function($scope, $ionicModal, $cordovaToast, $filter, ActivityTimingService, EventSendService, API, ActivitiesService) {
	var activities = ActivitiesService.listActivities();
        $scope.activities = [];

        for(i = 0; i < activities.length; i++){
            var updated_activity = ActivityTimingService.updateActivity(activities[i]);
            $scope.activities.push(updated_activity);
        }

	$scope.toggleActivity = function(activity) {
	    var activity = ActivityTimingService.updateActivity(activity, "toggle");
	    if (!activity.interval) {
		var message = activity.title + " for " + $filter('durationPartFilter')($filter('millisecondsToStringFilter')(activity.duration));
		try {
		    $scope.showToast(message);
		} catch (e) {
		    console.error(e);
		}

                var event = $filter('buildEventFilter')(activity);

		EventSendService.queueEvent(event);
	    }
	};

	$scope.showToast = function(message) {
	    $cordovaToast.show(message, 'long', 'bottom')
		.then(function(success) {
		    console.log("The toast was shown");
		}, function(error) {
		    console.log("The toast was not shown due to " + error);
		});
	};
    })

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
        $scope.activities = ActivitiesService.listActivities();
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
