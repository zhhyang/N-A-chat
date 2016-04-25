/**
 * Created by Freeman on 2016/4/14.
 */
angular.module('NAChat').controller('RoomsCtrl',['$scope', '$location','socket', 'server',function ($scope,$location,socket,server) {
    var rooms = server.getAllRooms();
    $scope.searchRoom = function () {
        if ($scope.searchKey) {
            $scope.filteredRooms = $scope.rooms.filter(function(room) {
                return room.name.indexOf($scope.searchKey) > -1
            })
        } else {
            $scope.filteredRooms = $scope.rooms;
        }

    };
    $scope.createRoom = function () {
        server.createRoom({
            name:$scope.searchKey
        });
    };
    $scope.filteredRooms = $scope.rooms = rooms;

    $scope.enterRoom = function (room) {
        $location.path('/rooms/' + room._id)
    };
    $scope.$watchCollection('rooms', function() {
        $scope.searchRoom();
    });
}]);