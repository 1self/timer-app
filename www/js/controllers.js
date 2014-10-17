angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope, $ionicModal) {
    $scope.timerEvents = [
        { title: 'Exercise' },
        { title: 'Meditate' },
        { title: 'Meetings' },
        { title: 'Tooth brushing' },
        { title: 'Sleeping' },
        { title: 'Coding' }
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
})

.controller('FriendsCtrl', function($scope, Friends) {
  $scope.friends = Friends.all();
})

.controller('FriendDetailCtrl', function($scope, $stateParams, Friends) {
  $scope.friend = Friends.get($stateParams.friendId);
})

.controller('AccountCtrl', function($scope) {
});
