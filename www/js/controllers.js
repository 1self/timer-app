angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope, $ionicModal, $cordovaToast, $filter, ActivityTimingService, ActivityEventService) {
	$scope.activities = ActivityTimingService.getAllActivities();

	$scope.toggleActivity = function(activity) {
		var status = ActivityTimingService.toggleActivity(activity);
		if (!status.running) {
			var message = status.title + " for " + $filter('millisecondsToStringFilter')(status.duration);
			try{
				$scope.showToast(message);
			} catch(e) {
				console.error(e);
			}

			ActivityEventService.queueEvent(status);
		}
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