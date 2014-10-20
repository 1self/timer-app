angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope, $ionicModal) {
    $scope.activities = [
        { title: 'Meditate', duration: 0},
        { title: 'Exercise', duration: 0},
        { title: 'Meetings', duration: 0},
        { title: 'Tooth brushing', duration: 0},
        { title: 'Sleeping', duration: 0},
        { title: 'Coding', duration: 0}
    ];
    $scope.addTimerEvent = function(){
        $scope.addTimerEventModal.show();
    };

    $ionicModal.fromTemplateUrl('templates/addTimerEvent.html', function(modal) {
        $scope.addTimerEventModal = modal;
    }, {
        scope: $scope,
        animation: 'slide-in-up'
    });
    $scope.closeNewTimerEvent = function(){
        $scope.addTimerEventModal.hide();
    };
    $scope.toggleActivity = function(activity) {
        if(!activity.interval) {
            activity.interval = setInterval(function () {
                activity.duration += 1;
                $scope.$apply();
            }, 1000);
        } else {
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

.controller('AccountCtrl', function($scope) {
});
