/**
 * Created by Freeman on 2016/4/12.
 */
angular.module('NAChat').controller('MessageCreatorCtrl',function ($scope,$routeParams,socket) {
    $scope.newMessage = '';
    $scope.createMessage = function () {
        if($scope.newMessage == ''){
            return
        }
        socket.emit('createMessage',{
            message:$scope.newMessage,
            creator: $scope.me,
            _roomId: $routeParams._roomId
        });
        $scope.newMessage = '';
    }

});