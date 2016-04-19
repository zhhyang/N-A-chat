/**
 * Created by Freeman on 2016/4/14.
 */
angular.module('NAChat').controller('RoomsCtrl',function ($scope,$location,socket) {

    socket.emit('getAllRooms')
    socket.on('roomsData', function (rooms) {
        $scope.rooms = $scope._rooms = rooms
    });
    $scope.searchRoom = function () {
        if ($scope.searchKey) {
            $scope.rooms = $scope._rooms.filter(function (room) {
                return room.name.indexOf($scope.searchKey) > -1
            })
        } else {
            $scope.rooms = $scope._rooms
        }

    };
    $scope.createRoom = function () {
        var name = $scope.searchKey;
        socket.emit('createRoom',name);
    };
    socket.on('roomAdded', function (room) {
        $scope._rooms.push(room)
        $scope.searchRoom()
    });


    $scope.enterRoom = function (room) {
        socket.emit('joinRoom',{
            user:$scope.me,
            room:room
        })
    };
    socket.on('joinRoom.' + $scope.me._id, function (join) {
        $location.path('/rooms/' + join.room._id)
    });
    socket.on('joinRoom', function (join) {
        $scope.rooms.forEach(function (room) {
            if (room._id == join.room._id) {
                room.users.push(join.user)
            }
        })
    })
});