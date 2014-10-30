angular.module('starter.controllers', [])

    .controller('DashCtrl', function($scope, $ionicModal, $cordovaToast, $filter, ActivityTimingService, ActivityEventService, API) {
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

                var event = $filter('toEventFilter')(activity, status);

		ActivityEventService.queueEvent(event);
	    }
	};

        $scope.showChart =  function(activity, $event){
            $event.stopImmediatePropagation();
            var api_credentials = angular.fromJson(window.localStorage.api_credentials),
            uri = API.endpoint + "/v1/streams/" +
                api_credentials.streamid + "/events/" +
                activity.objectTags.join(',') + "/" +
                activity.actionTags.join(',') +
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

    .controller('SummaryCtrl', function($scope, ActivitiesService) {
        $scope.activities = ActivitiesService.listActivities();
        
        $scope.filter = function(period){

        };
    })

    .controller('FriendDetailCtrl', function($scope, $stateParams, Friends) {
	$scope.friend = Friends.get($stateParams.friendId);
    })

    .controller('AccountCtrl', function($scope) {});