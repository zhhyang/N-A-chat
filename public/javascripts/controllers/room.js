/**
 * Created by Freeman on 2016/4/12.
 */
angular.module('NAChat').controller('RoomCtrl',['$scope', '$routeParams', 'socket', 'server',function ($scope,$routeParams,socket,server) {

    $scope.room = server.getRoom($routeParams._roomId);

    server.joinRoom({
        user: $scope.me,
        room: {
            _id: $routeParams._roomId
        }
    });
    
    $scope.$on('$routeChangeStart', function() {
        server.leaveRoom({
            user: $scope.me,
            _roomId: $routeParams._roomId
        })
    });
    
}]);