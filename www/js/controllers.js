angular.module('starter.controllers', [])

    .controller('DashCtrl', function($scope, $ionicModal, $cordovaToast, $filter, ActivityTimingService, ActivityEventService, API, ActivitiesService) {
	$scope.activities = ActivityTimingService.getAllActivities();

	$scope.toggleActivity = function(activity) {

	    var status = ActivityTimingService.toggleActivity(activity);
	    if (!status.running) {
		var message = status.title + " for " + $filter('millisecondsToStringFilter')(status.duration);
		try {
		    $scope.showToast(message);
		} catch (e) {
		    console.error(e);
		}

                var event = $filter('buildEventFilter')(activity, status);

		ActivityEventService.queueEvent(event);
	    }
	};

        $scope.showChart =  function(activity, $event){
            $event.stopImmediatePropagation();
            var api_credentials = angular.fromJson(window.localStorage.api_credentials),
            tags = ActivitiesService.getTags(activity.title),
            uri = API.endpoint + "/v1/streams/" +
                api_credentials.streamid + "/events/" +
                tags.objectTags.join(',') + "/" +
                tags.actionTags.join(',') +
                "/sum(duration)/daily/barchart";

            //window.open(uri);
            navigator.app.loadUrl(uri, { openExternal:true });
        };

	$scope.showToast = function(message) {
	    $cordovaToast.show(message, 'long', 'bottom')
		.then(function(success) {
		    console.log("The toast was shown");
		}, function(error) {
		    console.log("The toast was not shown due to " + error);
		});
	}
    })

    .controller('SummaryCtrl', function(moment, $scope, ActivityEventService) {
        $scope.events = ActivityEventService.getQueue();
        $scope.format_time = function(secs, type){
            var duration = moment.duration(secs * 1000);
            return duration[type]();
        };
    });