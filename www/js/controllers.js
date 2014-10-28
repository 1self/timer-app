angular.module('starter.controllers', [])

    .controller('DashCtrl', function($scope, $ionicModal, $cordovaToast, $filter, ActivityTimingService, ActivityEventService, $window, API) {
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

            $window.open(uri);
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

    .controller('FriendsCtrl', function($scope, Friends) {
	$scope.friends = Friends.all();
    })

    .controller('FriendDetailCtrl', function($scope, $stateParams, Friends) {
	$scope.friend = Friends.get($stateParams.friendId);
    })

    .controller('AccountCtrl', function($scope) {});