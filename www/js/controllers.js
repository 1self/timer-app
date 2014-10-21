angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope, $ionicModal, moment) {
	$scope.activities = [{
		title: 'Meditate'
	}, {
		title: 'Exercise'
	}, {
		title: 'Meetings'
	}, {
		title: 'Tooth brushing'
	}, {
		title: 'Sleeping'
	}, {
		title: 'Coding'
	}];

	$scope.toggleActivity = function(activity) {
		var updateActivityTime = function() {
			var elapsedTime = moment.duration(moment().diff(activity.startDate));
			activity.duration = moment.utc(elapsedTime.asMilliseconds());
			$scope.$apply();
		};
		if (!activity.interval) {
			activity.startDate = moment();
			activity.interval = setInterval(updateActivityTime, 1000);
		} else {
			delete activity.startDate;
			delete activity.duration;
			clearInterval(activity.interval);
			delete activity.interval;
		}
		console.log(activity);
	}
})

.controller('FriendsCtrl', function($scope, Friends) {
	$scope.friends = Friends.all();
})

.controller('FriendDetailCtrl', function($scope, $stateParams, Friends) {
	$scope.friend = Friends.get($stateParams.friendId);
})

.controller('AccountCtrl', function($scope) {});