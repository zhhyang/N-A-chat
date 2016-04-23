/**
 * Created by Freeman on 2016/4/12.
 */
angular.module('NAChat').controller('RoomCtrl',['$scope', '$routeParams', 'socket', 'server'],function ($scope,$routeParams,socket,server) {
    $scope.messages = [];
    server.getAllRooms($routeParams._roomId);
    

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
    
});