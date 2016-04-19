/**
 * Created by Freeman on 2016/4/12.
 */
angular.module('NAChat').controller('RoomCtrl',function ($scope,$routeParams,socket) {
    $scope.messages = [];
    socket.emit('getAllRooms',{
        _roomId:$routeParams._roomId
    });
    socket.on('roomData.'+$routeParams._roomId,function (room) {
        $scope.room = room;
    });
    socket.on('messageAdded',function (message) {
        $scope.room.messages.push(message);
    });

    socket.on('online', function (user) {
        $scope.room.users.push(user);
    });
    socket.on('offline', function (user) {
        var _userId = user._id;
        $scope.room.users = $scope.room.users.filter(function (user) {
            return user._id != _userId
        })
    });
    $scope.$on('$routeChangeStart', function() {
        socket.emit('leaveRoom', {
            user: $scope.me,
            _roomId: $routeParams._roomId
        })
    });
    socket.on('leaveRoom', function(leave) {
        var _userId = leave.user._id;
        $scope.room.users = $scope.room.users.filter(function(user) {
            return user._id != _userId
        })
    })
});