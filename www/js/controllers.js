angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope, $ionicModal, $cordovaToast, ActivityTimingService) {
	$scope.activities = ActivityTimingService.getAllActivities();

	$scope.toggleActivity = function(activity) {
		ActivityTimingService.toggleActivity(activity);
		$scope.showToast();
	};

	$scope.showToast = function() {
		$cordovaToast.show("Toast works!", 'long', 'bottom')
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